from matplotlib.patches import FancyBboxPatch


class Block:
    def __init__(
        self,
        ax,
        x=0.2,
        y=0.6,
        w=0.25,
        h=0.18,
        text="Building",
        rounding_size=0.03,
        pad=0.02,
        linewidth=2,
        min_w=0.06,
        min_h=0.05,
        edge_tol_px=15,  # Increased slightly for better UX
    ):
        self.ax = ax
        self.x, self.y, self.w, self.h = x, y, w, h
        self.text_str = text

        self.rounding_size = rounding_size
        self.pad = pad
        self.base_linewidth = linewidth
        self.min_w = min_w
        self.min_h = min_h
        self.edge_tol_px = edge_tol_px

        self.patch = FancyBboxPatch(
            (self.x, self.y),
            self.w,
            self.h,
            boxstyle=f"round,pad={self.pad},rounding_size={self.rounding_size}",
            linewidth=self.base_linewidth,
            facecolor="white",
            edgecolor="black",
        )
        self.ax.add_patch(self.patch)

        self.label = self.ax.text(
            self.x + self.w / 2,
            self.y + self.h / 2,
            self.text_str,
            ha="center",
            va="center",
            fontsize=14,
            fontweight="bold",
        )

        self.selected = False
        self._update_visual()

    def _center_text(self):
        self.label.set_position((self.x + self.w / 2, self.y + self.h / 2))

    def _update_patch(self):
        self.patch.set_bounds(self.x, self.y, self.w, self.h)

    def _update_visual(self):
        # Change color/width when selected to give visual feedback
        self.patch.set_linewidth(self.base_linewidth + (1 if self.selected else 0))
        self.patch.set_edgecolor("#0078d7" if self.selected else "black")
        self._update_patch()
        self._center_text()

    def set_text(self, s: str):
        self.text_str = s
        self.label.set_text(self.text_str)
        self._update_visual()

    def contains(self, mx, my) -> bool:
        return (self.x <= mx <= self.x + self.w) and (self.y <= my <= self.y + self.h)

    def _data_tol_from_px(self) -> float:
        fig = self.ax.figure
        if not fig:
            return 0.02
        bbox = self.ax.get_window_extent().transformed(fig.dpi_scale_trans.inverted())
        ax_w_px = bbox.width * fig.dpi
        if ax_w_px <= 1:
            return 0.02
        return self.edge_tol_px / ax_w_px

    def hit_test_edges(self, mx, my):
        """
        Returns a string containing 'l', 'r', 't', 'b' if on edge, or None.
        """
        tol = self._data_tol_from_px()

        # Check if we are anywhere near the box (outer bounds + tolerance)
        if not (
            self.x - tol <= mx <= self.x + self.w + tol
            and self.y - tol <= my <= self.y + self.h + tol
        ):
            return None

        # Check distance to each edge
        left = abs(mx - self.x) <= tol
        right = abs(mx - (self.x + self.w)) <= tol
        bottom = abs(my - self.y) <= tol
        top = abs(my - (self.y + self.h)) <= tol

        # We also need to make sure we are within the span of the edge
        # e.g. for left edge, y must be within [y, y+h]
        on_vert_span = self.y - tol <= my <= self.y + self.h + tol
        on_horz_span = self.x - tol <= mx <= self.x + self.w + tol

        dirs = ""
        if left and on_vert_span:
            dirs += "l"
        if right and on_vert_span:
            dirs += "r"
        if bottom and on_horz_span:
            dirs += "b"
        if top and on_horz_span:
            dirs += "t"

        return dirs if dirs else None

    def clamp_to_axes(self, xlim=(0.0, 1.0), ylim=(0.0, 1.0)):
        xmin, xmax = xlim
        ymin, ymax = ylim
        self.w = max(self.min_w, min(self.w, xmax - xmin))
        self.h = max(self.min_h, min(self.h, ymax - ymin))
        self.x = max(xmin, min(self.x, xmax - self.w))
        self.y = max(ymin, min(self.y, ymax - self.h))
        self._update_visual()
