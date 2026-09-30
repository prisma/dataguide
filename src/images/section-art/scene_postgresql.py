"""PostgreSQL: Prismo fits a glass puzzle piece (an extension) into the matching socket in the
front of a glass database."""
from kit import *

NAME = 'postgresql'

S, R, N = 36, 8, 5  # a puzzle piece: body size, knob radius, half the knob's neck


def piece_path(x, y):
    """The extension's puzzle piece with its body's top-left corner at (x, y): knobs on the top
    and right, flat on the bottom and left. Drawn clockwise."""
    m = S / 2
    return (f'M{x} {y + 4} Q{x} {y} {x + 4} {y} H{x + m - N} A{R} {R} 0 1 1 {x + m + N} {y} H{x + S - 4} Q{x + S} {y} {x + S} {y + 4} '
            f'V{y + m - N} A{R} {R} 0 1 1 {x + S} {y + m + N} V{y + S - 4} Q{x + S} {y + S} {x + S - 4} {y + S} '
            f'H{x + 4} Q{x} {y + S} {x} {y + S - 4} Z')


def glass_piece(x, y):
    d = piece_path(x, y)
    d2 = piece_path(x, y + 2.5)
    return f'''<g filter="url(#soft)">
      <path d="{d2}" fill="#dde2ea"/>
      <path d="{d}" fill="url(#glass)"/>
    </g>
    <path d="{d}" fill="url(#sweep)" fill-opacity=".28"/>
    <path d="{d}" fill="none" stroke="url(#prismEdge)" stroke-width="1.5" stroke-linejoin="round"/>'''


def build():
    cx, top, rx, ry = 242, 56, 72, 17  # the database bleeds off the right edge
    database, _ = glass_database(cx, top, rx=rx, ry=ry, heights=(20, 30, 30, 30), uid='postgresql')
    sx, sy = 232, 104  # the socket, across the yellow and cyan discs
    socket = piece_path(sx, sy)
    body = f'''  <!-- The database, with a puzzle-shaped socket in its front -->
{database}  <path d="{socket}" fill="#e6eaf0"/>
  <g clip-path="url(#postgresql-socket)"><path d="{socket}" fill="none" stroke="#8f9aa8" stroke-opacity=".6" stroke-width="6" filter="url(#blur2)" transform="translate(2.5 3)"/></g>
  <path d="{socket}" fill="{CYAN}" fill-opacity=".06" stroke="{CYAN}" stroke-opacity=".85" stroke-width="1.5" stroke-dasharray="5 4" stroke-linejoin="round"/>

{prismo(132, 98, tilt=4, face=6, eye_drop=3)}
  <!-- the piece, sliding into the socket -->
{speed_lines(168, 140)}{hand(175, 111, rot=-4, part='thumb')}  {glass_piece(178, 108)}
{hand(175, 111, rot=-4, part='body')}  <!-- the other hand steadies the database -->
{hand(184, 72, rot=4)}'''
    extra = f'  <defs><clipPath id="postgresql-socket"><path d="{socket}"/></clipPath></defs>'
    return svg((84, 30, 222, 190), 'Prismo fitting an extension into PostgreSQL.', body, extra)
