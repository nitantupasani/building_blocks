import matplotlib.pyplot as plt
from matplotlib.widgets import TextBox

from block import Block


class CanvasEditor:
    def __init__(self):
        self.fig, self.ax = plt.subplots(figsize=(12, 7))
        self.fig.subplots_adjust(left=0.02, right=0.98, bottom=0.10, top=0.98)
        self.ax.set_xlim(0, 1)
        self.ax.set_ylim(0, 1)
        self.ax.set_aspect("auto")
        self.ax.axis("off")

        self.blocks = []
        self.active_block = None

        self._dragging = False
        self._mode = None
        self._resize_dir = None
        self._press = None
        self._last_cursor = None  # Track cursor state to minimize Tk calls

        # In-canvas text editor
        self.editor_ax = self.fig.add_axes([0.15, 0.02, 0.70, 0.06])
        self.editor_ax.set_visible(False)
        self.textbox = TextBox(self.editor_ax, "Text: ", initial="")
        self.textbox.on_submit(self._on_text_submit)

        self.add_block(x=0.20, y=0.65, w=0.25, h=0.18, text="Building", select=True)

        c = self.fig.canvas
        c.mpl_connect("button_press_event", self.on_press)
        c.mpl_connect("button_release_event", self.on_release)
        c.mpl_connect("motion_notify_event", self.on_motion)
        c.mpl_connect("resize_event", self.on_resize)

    def on_resize(self, event):
        self.redraw()

    def add_block(self, x, y, w=0.25, h=0.18, text="Building", select=True):
        b = Block(self.ax, x=x, y=y, w=w, h=h, text=text)
        b.clamp_to_axes()
        self.blocks.append(b)
        if select:
            self.select_block(b)
        self.redraw()

    def redraw(self):
        for b in self.blocks:
            b._update_visual()
        self.fig.canvas.draw_idle()

    def deselect_all(self):
        for b in self.blocks:
            b.selected = False
        self.active_block = None
        self.hide_editor()

    def select_block(self, b: Block):
        for other in self.blocks:
            other.selected = other is b
        self.active_block = b
        self.hide_editor()
        self.redraw()

    def block_at(self, mx, my):
        for b in reversed(self.blocks):
            if b.contains(mx, my):
                return b
        return None

    def show_editor_for_active(self):
        if self.active_block is None:
            return
        self.editor_ax.set_visible(True)
        self.textbox.set_val(self.active_block.text_str)
        self.fig.canvas.draw_idle()

    def hide_editor(self):
        if self.editor_ax.get_visible():
            self.editor_ax.set_visible(False)
            self.fig.canvas.draw_idle()

    def _on_text_submit(self, text):
        if self.active_block:
            self.active_block.set_text(text)
        self.redraw()

    def _set_cursor(self, cursor_type):
        """
        Manually set the cursor using the Tk widget.
        cursor_type options for Tk: 'arrow', 'sb_h_double_arrow', 'sb_v_double_arrow',
        'fleur' (move)
        """
        if self._last_cursor == cursor_type:
            return

        try:
            # Access the underlying Tkinter widget
            self.fig.canvas.get_tk_widget().config(cursor=cursor_type)
            self._last_cursor = cursor_type
        except AttributeError:
            # Fallback if not using TkAgg
            pass

    def on_press(self, event):
        if event.inaxes is None or event.xdata is None:
            return
        if event.inaxes == self.editor_ax:
            return

        mx, my = float(event.xdata), float(event.ydata)

        # Double-click handling
        if getattr(event, "dblclick", False):
            b = self.block_at(mx, my)
            if b:
                self.select_block(b)
                self.show_editor_for_active()
            else:
                self.add_block(x=mx - 0.125, y=my - 0.09, select=True)
            return

        # Selection Check
        b = self.block_at(mx, my)

        # Priority: Check if we are clicking a resize handle of the CURRENT selection
        if self.active_block:
            resize_dir = self.active_block.hit_test_edges(mx, my)
            if resize_dir:
                self._dragging = True
                self._mode = "resize"
                self._resize_dir = resize_dir
                self._press = (
                    mx,
                    my,
                    self.active_block.x,
                    self.active_block.y,
                    self.active_block.w,
                    self.active_block.h,
                )
                return

        # If we clicked a new block
        if b:
            self.select_block(b)
            # Check edges of this newly selected block immediately
            resize_dir = b.hit_test_edges(mx, my)
            if resize_dir:
                self._mode = "resize"
                self._resize_dir = resize_dir
            else:
                self._mode = "drag"

            self._dragging = True
            self._press = (mx, my, b.x, b.y, b.w, b.h)
            return

        # Clicked whitespace
        self.deselect_all()
        self.redraw()

    def on_release(self, event):
        self._dragging = False
        self._mode = None
        self._resize_dir = None
        self._press = None
        self._set_cursor("arrow")  # Reset cursor on release
        self.redraw()

    def on_motion(self, event):
        if event.inaxes != self.ax or event.xdata is None:
            # If mouse leaves canvas, reset cursor
            if self._last_cursor != "arrow":
                self._set_cursor("arrow")
            return

        mx, my = float(event.xdata), float(event.ydata)

        # --- 1. HOVER STATE (No buttons pressed) ---
        if not self._dragging:
            if self.active_block:
                edges = self.active_block.hit_test_edges(mx, my)
                if edges:
                    if "l" in edges or "r" in edges:
                        self._set_cursor("sb_h_double_arrow")
                    elif "t" in edges or "b" in edges:
                        self._set_cursor("sb_v_double_arrow")
                elif self.active_block.contains(mx, my):
                    self._set_cursor("fleur")  # Move cursor
                else:
                    self._set_cursor("arrow")
            else:
                # Hover over unselected block
                b = self.block_at(mx, my)
                if b:
                    self._set_cursor("hand2")
                else:
                    self._set_cursor("arrow")
            return

        # --- 2. DRAG / RESIZE STATE ---
        if not self.active_block or not self._press:
            return

        press_mx, press_my, x0, y0, w0, h0 = self._press
        dx = mx - press_mx
        dy = my - press_my
        b = self.active_block

        if self._mode == "drag":
            self._set_cursor("fleur")
            b.x = x0 + dx
            b.y = y0 + dy
            b.clamp_to_axes()
            self.redraw()

        elif self._mode == "resize":
            new_x, new_y, new_w, new_h = x0, y0, w0, h0

            # Horizontal resize
            if "l" in self._resize_dir:
                new_w = w0 - dx
                if new_w < b.min_w:
                    new_w = b.min_w
                    new_x = (x0 + w0) - b.min_w
                else:
                    new_x = x0 + dx
            elif "r" in self._resize_dir:
                new_w = max(b.min_w, w0 + dx)

            # Vertical resize
            if "b" in self._resize_dir:
                new_h = h0 - dy
                if new_h < b.min_h:
                    new_h = b.min_h
                    new_y = (y0 + h0) - b.min_h
                else:
                    new_y = y0 + dy
            elif "t" in self._resize_dir:
                new_h = max(b.min_h, h0 + dy)

            b.x, b.y, b.w, b.h = new_x, new_y, new_w, new_h
            b.clamp_to_axes()
            self.redraw()
