"""Microsoft SQL Server: Prismo slides a drive sled into the empty bay of a glass server tower."""
from kit import *

NAME = 'mssql'

# The oblique depth axis: going into the tower moves up and to the right on screen
DX, DY = .86, -.5
LEDS = [CYAN, None, YELLOW, CYAN, RED]  # status lights per bay (bay 1 is the empty one)


def box(x, y, w, h, d, front, top, side, rx=4):
    """A box in oblique projection: front face at (x, y, w, h), `d` deep."""
    ox, oy = DX * d, DY * d
    return f'''<path d="M{x} {y} L{x + ox:g} {y + oy:g} H{x + w + ox:g} L{x + w} {y} Z" fill="{top}"/>
    <path d="M{x + w} {y} L{x + w + ox:g} {y + oy:g} V{y + h + oy:g} L{x + w} {y + h} Z" fill="{side}"/>
    <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{front}"/>'''


def drive(x, y, w, h, led, handle='#c6ccd6'):
    """The front of a drive sled: a handle, vents and a status light."""
    return (f'<rect x="{x + 6}" y="{y + h / 2 - 3:g}" width="{w * .34:g}" height="6" rx="3" fill="{handle}"/>'
            f'<path d="M{x + w * .5:g} {y + 5}v{h - 10}M{x + w * .5 + 5:g} {y + 5}v{h - 10}M{x + w * .5 + 10:g} {y + 5}v{h - 10}" stroke="#d3d9e1" stroke-width="1.5" stroke-linecap="round"/>'
            f'<circle cx="{x + w - 8}" cy="{y + h / 2:g}" r="2.6" fill="{led}"/>'
            f'<circle cx="{x + w - 8}" cy="{y + h / 2:g}" r="5" fill="{led}" fill-opacity=".22"/>')


def build():
    # The tower: front face, top and right side; it bleeds off the bottom (the site fades it)
    tx, ty, tw, th, td = 146, 44, 108, 190, 30
    bx, bw, bh, pitch = tx + 10, tw - 20, 26, 33
    rows = [ty + 14 + i * pitch for i in range(5)]
    empty = 1
    by = rows[empty]
    bays = ''.join(
        f'<rect x="{bx}" y="{y}" width="{bw}" height="{bh}" rx="4" fill="#f4f6f9" stroke="#e1e6ee" stroke-width="1.2"/>'
        + drive(bx, y, bw, bh, LEDS[i])
        for i, y in enumerate(rows) if i != empty)
    ox, oy = DX * td, DY * td
    tower = f'''  <g filter="url(#soft)">
    {box(tx, ty, tw, th, td, 'url(#glass)', '#f9fafc', 'url(#mssql-side)', rx=6)}
  </g>
  <rect x="{tx}" y="{ty}" width="{tw}" height="{th}" rx="6" fill="url(#sweep)" fill-opacity=".08"/>
  <rect x="{tx + .75}" y="{ty + .75}" width="{tw - 1.5}" height="{th - 1.5}" rx="5.25" fill="none" stroke="url(#rim)" stroke-width="1.5"/>
  <path d="M{tx} {ty} L{tx + ox:g} {ty + oy:g} H{tx + tw + ox:g}" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="1.2"/>
  {bays}
  <!-- the empty bay: a dark recess, with room around the sled going in -->
  <rect x="{bx}" y="{by}" width="{bw}" height="{bh}" rx="4" fill="url(#mssql-recess)"/>
'''
    # The sled, a third of the way in: its front face sticks out towards the viewer
    p = 44
    sw, sh = bw - 4, bh - 4
    sx, sy = bx + 2 - DX * p, by + 2 - DY * p
    sled = f'''  <g filter="url(#soft)">
    {box(sx, sy, sw, sh, p, '#e4e9f0', 'url(#mssql-top)', '#cfd6df', rx=4)}
    <rect x="{sx}" y="{sy}" width="{sw}" height="{sh}" rx="4" fill="url(#glass)"/>
  </g>
  <rect x="{sx}" y="{sy}" width="{sw}" height="{sh}" rx="4" fill="url(#sweep)" fill-opacity=".2"/>
  <rect x="{sx + .75:g}" y="{sy + .75:g}" width="{sw - 1.5}" height="{sh - 1.5}" rx="3.25" fill="none" stroke="url(#prismEdge)" stroke-width="1.5"/>
  {drive(sx, sy, sw, sh, CYAN, handle=YELLOW)}
'''
    defs = f'''  <defs>
    <linearGradient id="mssql-side" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#dfe4eb"/><stop offset="1" stop-color="#c3cad4"/>
    </linearGradient>
    <linearGradient id="mssql-top" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#fdfdfe"/><stop offset="1" stop-color="#d3d9e1"/>
    </linearGradient>
    <linearGradient id="mssql-recess" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6f7a89" stop-opacity=".75"/><stop offset="1" stop-color="#9aa3b1" stop-opacity=".6"/>
    </linearGradient>
  </defs>'''
    # the speed lines trail the sled along the depth axis
    trail = f'<g transform="translate({sx + 7:g} {sy + sh + 6:g}) rotate(-30)">\n{speed_lines(0, 0, gap=5)}  </g>\n'
    body = f'''  <!-- The server tower, with drive bays and status lights -->
{tower}
{prismo(98, 82, tilt=4, face=5, eye_drop=4)}
  <!-- the drive sled, sliding into the empty bay: one hand carries it from below (its thumb
       over the front), the other pushes its front -->
{hand(sx + sw - 16, sy + sh + 5, rot=-60, part='body')}{sled}{hand(sx + sw - 16, sy + sh + 5, rot=-60, part='thumb')}{trail}{hand(sx + 4, sy + 9, rot=-30)}'''
    return svg((50, 20, 230, 200), 'Prismo sliding a drive into a server.', body, defs)
