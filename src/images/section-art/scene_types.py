"""Database types: Prismo picks one data shape, a document, out of a row of glass cards that also
holds a table and a graph, leaving its slot empty."""
from kit import *

NAME = 'types'

W, H, RX = 58, 68, 10  # a card


def card(content, edge='rim'):
    """A glass card. The chosen one gets the prism edge, the others a plain rim."""
    stroke = ('url(#prismEdge)', '1.5') if edge == 'prism' else ('url(#rim)', '1.5')
    return f'''<g filter="url(#soft)">
      <rect x="0" y="2.5" width="{W}" height="{H}" rx="{RX}" fill="#dde2ea"/>
      <rect x="0" y="0" width="{W}" height="{H}" rx="{RX}" fill="url(#glass)" stroke="#e3e8ef"/>
    </g>
    <rect x="0" y="0" width="{W}" height="{H}" rx="{RX}" fill="url(#sweep)" fill-opacity="{'.16' if edge == 'prism' else '.08'}"/>
    <rect x=".75" y=".75" width="{W - 1.5}" height="{H - 1.5}" rx="{RX - .75}" fill="none" stroke="{stroke[0]}" stroke-width="{stroke[1]}"/>
    {content}'''


def table_face():
    rows = ''.join(
        f'<circle cx="15" cy="{y}" r="3.2" fill="{YELLOW}"/>'
        f'<rect x="23" y="{y - 3}" width="{w}" height="6" rx="3" fill="#c6ccd6"/>'
        for y, w in ((30, 26), (43, 20), (56, 24)))
    return (f'<rect x="7" y="8" width="{W - 14}" height="12" rx="4" fill="#eef1f6"/>'
            f'<rect x="11" y="11" width="8" height="6" rx="3" fill="#9aa3b1"/>'
            f'<rect x="23" y="11" width="22" height="6" rx="3" fill="#9aa3b1"/>'
            f'<path d="M9 36.5H{W - 9}M9 49.5H{W - 9}" stroke="#e1e6ee" stroke-width="1.3"/>'
            f'{rows}')


def document_face():
    # { } drawn as strokes, with indented key/value lines between them
    left = 'M22 15 q-5 0 -5 5 v9 q0 5 -5 5 q5 0 5 5 v9 q0 5 5 5'
    right = f'M{W - 22} 15 q5 0 5 5 v9 q0 5 5 5 q-5 0 -5 5 v9 q0 5 -5 5'
    return (f'<path d="{left}" fill="none" stroke="#7c8797" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<path d="{right}" fill="none" stroke="#7c8797" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<rect x="22" y="20" width="14" height="6" rx="3" fill="{CYAN}" fill-opacity=".85"/>'
            f'<rect x="26" y="31" width="12" height="6" rx="3" fill="{YELLOW}"/>'
            f'<rect x="26" y="42" width="10" height="6" rx="3" fill="{RED}" fill-opacity=".75"/>')


def graph_face():
    nodes = ((18, 20, CYAN), (44, 32, YELLOW), (22, 52, RED))
    (ax, ay, _), (bx, by, _), (cx, cy, _) = nodes
    edges = f'M{ax} {ay}L{bx} {by}L{cx} {cy}Z'
    dots = ''.join(f'<circle cx="{x}" cy="{y}" r="6.5" fill="{c}"/>'
                   f'<circle cx="{x - 1.8}" cy="{y - 2}" r="2" fill="#fff" fill-opacity=".5"/>' for x, y, c in nodes)
    return f'<path d="{edges}" fill="none" stroke="#b3bcc8" stroke-width="2.2" stroke-linejoin="round"/>{dots}'


def build():
    # A row of data shapes; the document has been lifted up out of the middle, leaving its slot empty
    slot = (180, 104)
    table = f'<g transform="translate(116 108) rotate(-8)">{card(table_face())}</g>'
    graph = f'<g transform="translate(242 102) rotate(8)">{card(graph_face())}</g>'
    ghost = (f'<rect x="{slot[0]}" y="{slot[1]}" width="{W}" height="{H}" rx="{RX}" fill="{CYAN}" fill-opacity=".06" '
             f'stroke="{CYAN}" stroke-opacity=".75" stroke-width="1.5" stroke-dasharray="5 4"/>')
    doc = f'<g transform="translate(146 26) rotate(-6)">{card(document_face(), edge="prism")}</g>'
    body = f'''  <!-- A row of data shapes: table, (document) and graph -->
  {ghost}
  {table}
  {graph}
{prismo(96, 94, tilt=3, face=7, eye_drop=-2)}
  <!-- the near hand rests on the table card -->
{hand(141, 106, rot=14)}  <!-- the document, lifted out of its slot and held up to look at -->
{speed_lines(198, 96, dx=.45, dy=1, gap=6)}{hand(148, 34, rot=10, part='thumb')}  {doc}
{hand(148, 34, rot=10, part='body')}'''
    return svg((48, 12, 250, 192), 'Prismo choosing a type of database: document, table or graph.', body)
