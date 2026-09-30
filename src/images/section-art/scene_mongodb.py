"""MongoDB: Prismo files a JSON document into a collection, a glass tray of documents."""
from kit import *

NAME = 'mongodb'

# The oblique depth axis: going back into the tray moves up and to the right on screen
DX, DY = .86, -.5
DW, DH = 46, 58  # a document


def brace(x, y0, y1, color, width=2.2, flip=False):
    """A curly brace drawn as a stroke, its point at x; `flip` draws the closing brace."""
    s = -1 if flip else 1
    ym = (y0 + y1) / 2
    return (f'<path d="M{x + 5 * s} {y0} Q{x + 2.4 * s} {y0} {x + 2.4 * s} {y0 + 3} V{ym - 2.6} '
            f'Q{x + 2.4 * s} {ym} {x} {ym} Q{x + 2.4 * s} {ym} {x + 2.4 * s} {ym + 2.6} V{y1 - 3} '
            f'Q{x + 2.4 * s} {y1} {x + 5 * s} {y1}" fill="none" stroke="{color}" stroke-width="{width}" '
            f'stroke-linecap="round" stroke-linejoin="round"/>')


def fields(rows, key, values):
    """Key/value lines between the braces: a key dot and a value pill per row."""
    top = DH / 2 - (len(rows) - 1) * 5.5
    return ''.join(
        f'<circle cx="16" cy="{top + i * 11:g}" r="2.6" fill="{key}"/>'
        f'<rect x="21" y="{top + i * 11 - 3:g}" width="{w}" height="6" rx="3" fill="{values[i % len(values)]}"/>'
        for i, w in enumerate(rows))


def document(content_rows, key, values, brace_color, edge):
    return f'''<rect x="0" y="0" width="{DW}" height="{DH}" rx="7" fill="url(#glass)"/>
      <rect x="0" y="0" width="{DW}" height="{DH}" rx="7" fill="url(#sweep)" fill-opacity="{'.2' if edge == 'url(#prismEdge)' else '.07'}"/>
      <rect x=".75" y=".75" width="{DW - 1.5}" height="{DH - 1.5}" rx="6.25" fill="none" stroke="{edge}" stroke-width="1.5"/>
      {brace(7, 10, DH - 10, brace_color)}{brace(DW - 7, 10, DH - 10, brace_color, flip=True)}
      {fields(content_rows, key, values)}'''


def build():
    # The tray: an open glass box, front face (tx, ty, tw, th), td deep; documents stand in it
    # on a floor `sink` below the rim
    tx, ty, tw, th, td, sink = 142, 156, 66, 50, 52, 14
    ox, oy = DX * td, DY * td
    interior = f'''  <g filter="url(#soft)">
    <path d="M{tx} {ty} L{tx + ox:g} {ty + oy:g} H{tx + tw + ox:g} V{ty + th + oy:g} H{tx + tw} L{tx} {ty + th} Z" fill="#e4e9f0"/>
  </g>
  <path d="M{tx} {ty} L{tx + ox:g} {ty + oy:g} V{ty + th + oy:g} L{tx} {ty + th} Z" fill="#d3d9e1"/>
  <path d="M{tx} {ty} L{tx + ox:g} {ty + oy:g} H{tx + tw + ox:g}" fill="none" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/>
'''
    # The collection: documents standing in the tray, back to front, each with its own fields
    stack = ''
    for d, rows in ((46, (12, 8)), (32, (8, 12, 10)), (18, (10, 6, 12, 8))):
        x, y = tx + 9 + DX * d, ty + sink - DH + DY * d
        stack += f'''  <g transform="translate({x:g} {y:g})" filter="url(#soft)">
      {document(rows, '#c6ccd6', ['#d3d9e1'], '#aeb8c6', '#e3e8ef')}
  </g>
'''
    front = f'''  <g filter="url(#soft)">
    <path d="M{tx + tw} {ty} L{tx + tw + ox:g} {ty + oy:g} V{ty + th + oy:g} L{tx + tw} {ty + th} Z" fill="url(#mongodb-side)"/>
    <rect x="{tx}" y="{ty}" width="{tw}" height="{th}" rx="4" fill="url(#glass)" stroke="#e3e8ef"/>
  </g>
  <rect x="{tx}" y="{ty}" width="{tw}" height="{th}" rx="4" fill="url(#sweep)" fill-opacity=".1"/>
  <rect x="{tx + .75}" y="{ty + .75}" width="{tw - 1.5}" height="{th - 1.5}" rx="3.25" fill="none" stroke="url(#rim)" stroke-width="1.5"/>
  <path d="M{tx + 3} {ty} H{tx + tw} L{tx + tw + ox:g} {ty + oy:g}" fill="none" stroke="url(#prismEdge)" stroke-width="1.5" stroke-linejoin="round"/>
  <!-- a label frame, as on a card-file box -->
  <rect x="{tx + tw / 2 - 17:g}" y="{ty + 13}" width="34" height="13" rx="3.5" fill="#eef1f6" stroke="#d3d9e1" stroke-width="1.2"/>
  <rect x="{tx + tw / 2 - 11:g}" y="{ty + 17.5}" width="22" height="4" rx="2" fill="#c6ccd6"/>
'''
    # The new document, coming down into the front of the tray
    nx, ny, rot = tx + 10, 84, -3
    new = f'''  <g transform="translate({nx} {ny}) rotate({rot})" filter="url(#soft)">
      {document((12, 8, 10), YELLOW, [CYAN, RED], '#6f7a89', 'url(#prismEdge)')}
  </g>
'''
    defs = '''  <defs>
    <linearGradient id="mongodb-side" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#dfe4eb"/><stop offset="1" stop-color="#c3cad4"/>
    </linearGradient>
  </defs>'''
    body = f'''  <!-- The collection: a glass tray of documents -->
{interior}{stack}{front}
{prismo(110, 100, tilt=3, face=5, eye_drop=0)}
  <!-- the new document, lowered into the tray: one hand holds its top edge, the other carries
       its bottom corner (fingers behind, thumb in front) -->
{speed_lines(nx + 39, ny - 7, dx=0, dy=-1, gap=6)}{hand(nx + 21, ny - 5, rot=84, part='thumb')}{hand(nx + 13, ny + DH + 3, rot=-75, part='body')}{new}{hand(nx + 13, ny + DH + 3, rot=-75, part='thumb')}{hand(nx + 21, ny - 5, rot=84, part='body')}'''
    return svg((58, 44, 206, 186), 'Prismo filing a document in a collection.', body, defs)
