"""Just for fun: Prismo juggles three small glass databases."""
import math
from kit import *

NAME = 'just-for-fun'

# A small glass database: rx, ry and disc heights
RX, RY, HEIGHTS = 15, 4.5, (7, 8, 8, 8)
TALL = sum(HEIGHTS)


def small_db(cx, cy, rot, uid):
    """A small glass database centred at (cx, cy), turned by `rot` degrees."""
    db, _ = glass_database(0, -TALL / 2, rx=RX, ry=RY, heights=HEIGHTS, uid=uid)
    return f'  <g transform="translate({cx} {cy}) rotate({rot})">\n{db}  </g>\n'


def held(cx, cy, rot, uid):
    """A small database resting on a palm: the fingers behind it, the thumb in front."""
    a = math.radians(rot)
    d = TALL / 2 + RY + 3
    hx, hy = round(cx - d * math.sin(a), 1), round(cy + d * math.cos(a), 1)
    return (hand(hx, hy, rot=rot - 90, part='body') + small_db(cx, cy, rot, uid)
            + hand(hx, hy, rot=rot - 90, part='thumb'))


def build():
    x, y = 122, 110  # Prismo
    # The juggling arc: from the right hand, over his head, down to the left hand
    p0, p1, p2 = (x + 58, y + 8), (x - 4, y - 146), (x - 72, y + 6)

    def on_arc(t):
        return tuple((1 - t) ** 2 * a + 2 * (1 - t) * t * b + t ** 2 * c for a, b, c in zip(p0, p1, p2))

    def tangent(t):
        return tuple(2 * (1 - t) * (b - a) + 2 * t * (c - b) for a, b, c in zip(p0, p1, p2))

    def trail(t, back=20):
        """Speed lines behind a database at `t` on the arc."""
        (px, py), (tx, ty) = on_arc(t), tangent(t)
        n = math.hypot(tx, ty)
        ang = math.degrees(math.atan2(-ty, -tx))
        sx, sy = px - tx / n * back, py - ty / n * back
        return f'  <g transform="rotate({ang:.1f} {sx:.1f} {sy:.1f})">\n{speed_lines(round(sx, 1), round(sy, 1), dx=1)}  </g>\n'

    a = (p0[0], p0[1])          # in the right hand, about to be tossed
    b = on_arc(.5)              # at the top of the arc
    tc = .92
    c = on_arc(tc)              # coming down into the left hand
    # the arc, drawn from the right hand to the database coming down
    (sx, sy), (ex, ey), (tx, ty) = on_arc(0), on_arc(tc), tangent(0)
    arc = f'M{sx} {sy} Q{sx + tc / 2 * tx:.1f} {sy + tc / 2 * ty:.1f} {ex:.1f} {ey:.1f}'
    body = f'''  <!-- the arc the databases fly along -->
  <path d="{arc}" fill="none" stroke="url(#prismEdge)" stroke-opacity=".45" stroke-width="1.5" stroke-dasharray="4 5" stroke-linecap="round"/>

{prismo(x, y, tilt=-3, face=-1, eye_drop=-4)}
  <!-- the right hand holds one database, about to toss it -->
{held(a[0], a[1], -4, 'just-for-fun-a')}
  <!-- one at the top of the arc -->
{trail(.5)}{small_db(round(b[0], 1), round(b[1], 1), -14, 'just-for-fun-b')}
  <!-- one coming down into the left hand -->
{trail(tc)}{held(round(c[0], 1), round(c[1], 1), -20, 'just-for-fun-c')}'''
    return svg((26, 6, 196, 190), 'Prismo juggling three databases.', body)
