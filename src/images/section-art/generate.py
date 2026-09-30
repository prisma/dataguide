"""Generates the section artwork: Prismo working with a table (data modeling) and a database
(introduction). Run `python3 src/images/section-art/generate.py` after changing it; the SVGs it
writes next to this file are what the site uses. Both scenes share the same drawing of Prismo, materials and lighting:
key light from the upper left (cool), warm fill from the right, soft drop shadows."""
import pathlib

OUT = pathlib.Path(__file__).parent
CYAN, YELLOW, RED, INK = '#01D7E4', '#F3C306', '#F34A60', '#121212'

DEFS = f'''  <defs>
    <!-- chrome -->
    <radialGradient id="chrome" cx="35%" cy="28%" r="78%">
      <stop offset="0" stop-color="#fbfcfe"/>
      <stop offset=".35" stop-color="#dfe5ec"/>
      <stop offset=".62" stop-color="#aeb8c6"/>
      <stop offset=".85" stop-color="#7c8797"/>
      <stop offset="1" stop-color="#5f6a79"/>
    </radialGradient>
    <radialGradient id="shine" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fff" stop-opacity=".75"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ear" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#eef1f5"/>
      <stop offset=".55" stop-color="#b3bcc8"/>
      <stop offset="1" stop-color="#7f8a99"/>
    </linearGradient>
    <linearGradient id="foot" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8f9aa8"/>
      <stop offset=".35" stop-color="#e6eaf0"/>
      <stop offset="1" stop-color="#7c8797"/>
    </linearGradient>
    <linearGradient id="mitt" x1="0" y1="0" x2=".8" y2="1">
      <stop offset="0" stop-color="#fdfdfe"/>
      <stop offset=".55" stop-color="#cfd6df"/>
      <stop offset="1" stop-color="#8f9aa8"/>
    </linearGradient>
    <!-- the visor: three flat prism bands (never recoloured) -->
    <linearGradient id="visor" gradientUnits="userSpaceOnUse" x1="0" y1="-12" x2="0" y2="15">
      <stop offset="0" stop-color="{CYAN}"/><stop offset=".3333" stop-color="{CYAN}"/>
      <stop offset=".3333" stop-color="{YELLOW}"/><stop offset=".6667" stop-color="{YELLOW}"/>
      <stop offset=".6667" stop-color="{RED}"/><stop offset="1" stop-color="{RED}"/>
    </linearGradient>
    <linearGradient id="visorShade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="{INK}" stop-opacity=".3"/>
      <stop offset=".22" stop-color="{INK}" stop-opacity="0"/>
      <stop offset=".78" stop-color="{INK}" stop-opacity="0"/>
      <stop offset="1" stop-color="{INK}" stop-opacity=".3"/>
    </linearGradient>
    <!-- glass -->
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#f1f4f8"/>
    </linearGradient>
    <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{CYAN}"/>
      <stop offset=".5" stop-color="{YELLOW}"/>
      <stop offset="1" stop-color="{RED}"/>
    </linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2=".7" y2=".7">
      <stop offset="0" stop-color="#fff" stop-opacity=".95"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="prismEdge" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="{CYAN}"/>
      <stop offset=".5" stop-color="{YELLOW}"/>
      <stop offset="1" stop-color="{RED}"/>
    </linearGradient>
    <clipPath id="headClip"><circle cx="0" cy="0" r="35"/></clipPath>
    <clipPath id="visorClip"><path d="M-36 -12 Q0 -9 36 -12 L36 13 Q0 16 -36 13 Z"/></clipPath>
    <filter id="blur6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="blur2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5"/></filter>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <filter id="soft" x="-80%" y="-80%" width="260%" height="280%">
      <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="{INK}" flood-opacity=".14"/>
    </filter>
  </defs>'''


def prismo(x, y, tilt=0, face=0, eye_drop=0, near_ear='left'):
    """Prismo's head centred at (x, y). `tilt` rotates the head (degrees, positive = right side
    down), `face` moves the face towards where he's looking, `eye_drop` looks down."""
    left_rx, right_rx = (8, 5) if near_ear == 'left' else (5, 8)
    tints = '''<ellipse cx="-16" cy="-12" rx="22" ry="20" fill="#9fd6ff" fill-opacity=".28"/>
          <ellipse cx="20" cy="-8" rx="18" ry="22" fill="#f6c86a" fill-opacity=".32"/>
          <ellipse cx="0" cy="30" rx="26" ry="8" fill="#f2c66d" fill-opacity=".18"/>'''
    ey = 2 + eye_drop
    return f'''  <g transform="translate({x} {y}) rotate({tilt})" filter="url(#soft)">
    <!-- foot -->
    <path d="M-9 32 h18 l2.5 6 h-23 z" fill="url(#foot)"/>
    <ellipse cx="0" cy="38" rx="11.5" ry="1.6" fill="#6f7a89"/>
    <!-- ear cups -->
    <g>
      <ellipse cx="-35" cy="1" rx="{left_rx}" ry="12" fill="url(#ear)" stroke="#fff" stroke-opacity=".8" stroke-width="1"/>
      <ellipse cx="-35" cy="1" rx="{left_rx * .56:g}" ry="9" fill="#c3cad4"/>
      <ellipse cx="35" cy="1" rx="{right_rx}" ry="12" fill="url(#ear)" stroke="#fff" stroke-opacity=".8" stroke-width="1"/>
      <ellipse cx="35" cy="1" rx="{right_rx * .56:g}" ry="9" fill="#c3cad4"/>
    </g>
    <!-- head: chrome with cool and warm reflections -->
    <circle cx="0" cy="0" r="35" fill="url(#chrome)"/>
    <g clip-path="url(#headClip)"><g filter="url(#blur6)">
          {tints}
    </g></g>
    <!-- visor -->
    <path d="M-36 -12 Q0 -9 36 -12 L36 13 Q0 16 -36 13 Z" fill="url(#visor)" clip-path="url(#headClip)"/>
    <path d="M-36 -12 Q0 -9 36 -12 L36 13 Q0 16 -36 13 Z" fill="url(#visorShade)" clip-path="url(#headClip)"/>
    <g clip-path="url(#visorClip)" opacity=".5"><g filter="url(#blur6)">
          {tints}
    </g></g>
    <!-- hatch seam -->
    <path d="M-25 -26 L-21 -16 Q0 -10 21 -16 L25 -26" fill="none" stroke="#6d7787" stroke-width="1.2" stroke-linejoin="round" clip-path="url(#headClip)"/>
    <path d="M-24 -25 L-20.4 -15 Q0 -9 20.4 -15 L24 -25" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1" clip-path="url(#headClip)"/>
    <!-- face -->
    <g transform="translate({face} 0)">
      <path d="M-16 -5 q4 -3 8 -1" fill="none" stroke="#0e1014" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M16 -8 q-4 -3 -8 -1" fill="none" stroke="#0e1014" stroke-width="1.6" stroke-linecap="round"/>
      <ellipse cx="-12" cy="{ey}" rx="3.5" ry="5.6" fill="#0e1014"/>
      <ellipse cx="12" cy="{ey}" rx="3.5" ry="5.6" fill="#0e1014"/>
      <ellipse cx="-13.2" cy="{ey - 2}" rx="1.1" ry="2" fill="#fff" fill-opacity=".5"/>
      <ellipse cx="10.8" cy="{ey - 2}" rx="1.1" ry="2" fill="#fff" fill-opacity=".5"/>
      <path d="M-7 16 Q0 22 8 16" fill="none" stroke="#1c1f26" stroke-width="1.6" stroke-linecap="round"/>
    </g>
    <!-- soft highlight and grain -->
    <ellipse cx="-14" cy="-18" rx="9" ry="6" fill="url(#shine)"/>
    <rect x="-35" y="-35" width="70" height="70" filter="url(#grain)" opacity=".06" clip-path="url(#headClip)"/>
  </g>
'''


def hand(x, y, rot=0, scale=1.3, part='all'):
    """A mitt with three fingers pointing right (before rotation) and a thumb on top.
    `part` draws only the thumb or only the palm and fingers, to put them on either side of
    something the hand is holding."""
    fingers = ''.join(
        f'<rect x="3" y="{fy}" width="10.5" height="3.8" rx="1.9" fill="url(#mitt)" stroke="#8f9aa8" stroke-width=".6"/>'
        f'<path d="M8.6 {fy + .4}v3" stroke="{INK}" stroke-opacity=".3" stroke-width=".6"/>'
        for fy in (-5.6, -1.9, 1.8))
    thumb = '<ellipse cx="-.5" cy="-6.8" rx="3.3" ry="2.4" transform="rotate(-30 -.5 -6.8)" fill="url(#mitt)" stroke="#8f9aa8" stroke-width=".6"/>'
    body = f'{fingers}<ellipse cx="0" cy="0" rx="7.5" ry="6.8" fill="url(#mitt)" stroke="#8f9aa8" stroke-width=".7"/>'
    content = {'all': body + thumb, 'thumb': thumb, 'body': body}[part]
    return f'''  <g transform="translate({x} {y}) rotate({rot}) scale({scale})" filter="url(#soft)">{content}</g>
'''


def glass_slab(w, h, rx, cells):
    """A small slab of glass (a tuple or record): light fill, thin prism edge, thickness."""
    return f'''<rect x="0" y="2" width="{w}" height="{h}" rx="{rx}" fill="#e4e9f0"/>
    <rect x="0" y="0" width="{w}" height="{h}" rx="{rx}" fill="url(#glass)"/>
    <rect x="0" y="0" width="{w}" height="{h}" rx="{rx}" fill="url(#sweep)" fill-opacity=".2"/>
    <rect x=".75" y=".75" width="{w - 1.5}" height="{h - 1.5}" rx="{rx - .75}" fill="none" stroke="url(#prismEdge)" stroke-width="1.5"/>
    {cells}'''


def speed_lines(x, y, dx=-1, dy=0, gap=5):
    lines = []
    for i, (color, length) in enumerate(((CYAN, 10), (YELLOW, 16), (RED, 10))):
        ox, oy = (0, (i - 1) * gap) if dy == 0 else ((i - 1) * gap, 0)
        lines.append(f'<path d="M{x + ox} {y + oy} l{dx * length} {dy * length}" stroke="{color}" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>')
    return '  ' + '\n  '.join(lines) + '\n'


def table_scene():
    # Canvas 360 x 220; the table bleeds off the top and right edges
    px, py, pw, ph = 150, -14, 240, 222
    rows_y = [60, 86, 112, 164, 190]  # row centre lines; the slot is at 138
    slot_y = 138
    col = [190, 222, 282]
    cells = []
    widths = [(34, 58), (42, 50), (30, 62), (28, 60), (38, 48)]
    for (w1, w2), y in zip(widths, rows_y):
        cells.append(f'<circle cx="{col[0] - 6}" cy="{y}" r="4.3" fill="{YELLOW}"/>'
                     f'<rect x="{col[1] + 6}" y="{y - 4}" width="{w1}" height="8" rx="4" fill="#c6ccd6"/>'
                     f'<rect x="{col[2] + 6}" y="{y - 4}" width="{w2}" height="8" rx="4" fill="#c6ccd6"/>')
    line_ys = [73, 99, 125, 151, 177]
    tuple_cells = (f'<circle cx="14" cy="11" r="4.3" fill="{YELLOW}"/>'
                   f'<rect x="28" y="7" width="30" height="8" rx="4" fill="{CYAN}" fill-opacity=".8"/>'
                   f'<rect x="66" y="7" width="40" height="8" rx="4" fill="{RED}" fill-opacity=".7"/>')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="296" height="220" viewBox="64 0 296 220">
  <!-- Prismo placing a tuple (a row) into a table. Brand style: chrome, glass and the prism
       colours cyan {CYAN}, yellow {YELLOW} and red {RED}. -->
{DEFS}

  <!-- The table: a glass panel with a header row, rows and an empty slot -->
  <g filter="url(#soft)">
    <rect x="{px}" y="{py + 3}" width="{pw}" height="{ph}" rx="18" fill="#d9dee6"/>
    <rect x="{px}" y="{py}" width="{pw}" height="{ph}" rx="18" fill="url(#glass)" stroke="#e3e8ef"/>
  </g>
  <rect x="{px}" y="{py}" width="{pw}" height="{ph}" rx="18" fill="url(#sweep)" fill-opacity=".07"/>
  <rect x="{px + .75}" y="{py + .75}" width="{pw - 1.5}" height="{ph - 1.5}" rx="17.25" fill="none" stroke="url(#rim)" stroke-width="1.5"/>
  <!-- header row -->
  <rect x="{px + 14}" y="{py + 32}" width="{pw - 28}" height="24" rx="7" fill="#eef1f6"/>
  <rect x="{col[0] - 12}" y="{py + 40}" width="14" height="8" rx="4" fill="#9aa3b1"/>
  <rect x="{col[1] + 6}" y="{py + 40}" width="40" height="8" rx="4" fill="#9aa3b1"/>
  <rect x="{col[2] + 6}" y="{py + 40}" width="56" height="8" rx="4" fill="#9aa3b1"/>
  <!-- grid -->
  <path d="M{col[1]} 48V196M{col[2]} 48V196" stroke="#e1e6ee" stroke-width="1.5"/>
  <path d="{''.join(f'M{px + 14} {y}H{px + pw - 14}' for y in line_ys)}" stroke="#e1e6ee" stroke-width="1.5"/>
  {''.join(cells)}
  <!-- the empty slot, with a faint ghost of the row that belongs there -->
  <rect x="{px + 12}" y="{slot_y - 11}" width="{pw - 24}" height="22" rx="7" fill="{CYAN}" fill-opacity=".06" stroke="{CYAN}" stroke-opacity=".75" stroke-width="1.5" stroke-dasharray="5 4"/>
  <g opacity=".12" transform="translate({px + 22} {slot_y - 11})">{tuple_cells}</g>

{prismo(112, 88, tilt=5, face=5, eye_drop=2)}
  <!-- the tuple, sliding into the slot -->
{speed_lines(96, 143)}  <ellipse cx="200" cy="{slot_y + 11}" rx="32" ry="3.5" fill="{INK}" fill-opacity=".1" filter="url(#blur2)"/>
  <!-- back hand supports the tuple from below; its thumb wraps over the tail -->
{hand(108, 158, rot=-80, part='body')}  <g transform="translate(102 128) rotate(2)" filter="url(#soft)">
    {glass_slab(118, 22, 7, tuple_cells)}
  </g>
{hand(108, 158, rot=-80, part='thumb')}  <!-- front hand pushes the tuple towards the slot -->
{hand(146, 130, rot=4)}</svg>
'''


def database_scene():
    # Canvas 250 x 220; the database bleeds off the right edge
    cx, rx, ry, top = 196, 62, 15, 104
    opening_rx, opening_ry = rx - 14, ry - 4
    # Glass discs from the top, in the order of the brand's glass database render
    discs = [('#f9fafc', '#c9d0da', 20), ('#f8d64a', '#d9a800', 26), ('#6be9f0', '#00aebb', 26), ('#f7788a', '#d8324a', 26)]
    grads, sides, seams = [], [], []
    y = top
    for i, (light, dark, h) in enumerate(discs):
        grads.append(f'<linearGradient id="disc{i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{light}"/><stop offset="1" stop-color="{dark}"/></linearGradient>')
        sides.append(f'<path d="M{cx - rx} {y} A{rx} {ry} 0 0 0 {cx + rx} {y} V{y + h} A{rx} {ry} 0 0 1 {cx - rx} {y + h} Z" fill="url(#disc{i})" fill-opacity=".9"/>')
        if i:
            seams.append(f'<path d="M{cx - rx} {y} A{rx} {ry} 0 0 0 {cx + rx} {y}" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.2"/>')
        y += h
    bottom = y
    body = f'M{cx - rx} {top} V{bottom} A{rx} {ry} 0 0 0 {cx + rx} {bottom} V{top} Z'
    record_cells = (f'<circle cx="12" cy="11" r="4" fill="{YELLOW}"/>'
                    f'<rect x="22" y="7" width="26" height="8" rx="4" fill="{CYAN}" fill-opacity=".8"/>'
                    f'<rect x="10" y="21" width="38" height="7" rx="3.5" fill="{RED}" fill-opacity=".6"/>')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="192" height="186" viewBox="58 34 192 186">
  <!-- Prismo storing a record in a database. Brand style: chrome, glass and the prism colours
       cyan {CYAN}, yellow {YELLOW} and red {RED}. -->
{DEFS}
  <defs>{''.join(grads)}</defs>
  <clipPath id="aboveRim">
    <rect x="0" y="0" width="260" height="{top}"/>
    <ellipse cx="{cx}" cy="{top}" rx="{opening_rx}" ry="{opening_ry}"/>
  </clipPath>

  <!-- The database: glass discs -->
  <g filter="url(#soft)">
    {''.join(reversed(sides))}
    {''.join(seams)}
    <ellipse cx="{cx}" cy="{top}" rx="{rx}" ry="{ry}" fill="#f9fafc" stroke="#e3e8ef"/>
  </g>
  <path d="{body}" fill="url(#sweep)" fill-opacity=".07"/>
  <path d="M{cx - rx + .75} {bottom} V{top}" fill="none" stroke="url(#rim)" stroke-width="1.5"/>
  <ellipse cx="{cx - 30}" cy="{top + 16}" rx="14" ry="4" fill="#fff" fill-opacity=".7" filter="url(#blur2)"/>
  <!-- the opening: recessed, with a prism ring -->
  <ellipse cx="{cx}" cy="{top}" rx="{opening_rx}" ry="{opening_ry}" fill="#cfd6df"/>
  <ellipse cx="{cx}" cy="{top - 3}" rx="{opening_rx - 6}" ry="{opening_ry - 4}" fill="#8f9aa8" fill-opacity=".55" filter="url(#blur2)"/>
  <ellipse cx="{cx}" cy="{top}" rx="{opening_rx}" ry="{opening_ry}" fill="none" stroke="url(#prismEdge)" stroke-width="1.5"/>

{prismo(106, 100, tilt=3, face=5, eye_drop=-1)}
  <!-- the record, dropping into the opening; the hand holds its top-left corner -->
{speed_lines(186, 67, dx=0, dy=-1, gap=6)}{hand(166, 74, rot=14, part='thumb')}  <g clip-path="url(#aboveRim)">
    <g transform="translate(164 70) rotate(14)" filter="url(#soft)">
      {glass_slab(58, 34, 8, record_cells)}
    </g>
  </g>
  <!-- the database's front rim, in front of the record -->
  <path d="M{cx - opening_rx} {top} A{opening_rx} {opening_ry} 0 0 0 {cx + opening_rx} {top}" fill="none" stroke="url(#prismEdge)" stroke-width="1.5"/>
{hand(166, 74, rot=14, part='body')}  <!-- the other hand rests on the database's rim -->
{hand(150, 114, rot=8)}</svg>
'''


if __name__ == '__main__':
    (OUT / 'datamodeling-scene.svg').write_text(table_scene())
    (OUT / 'intro-scene.svg').write_text(database_scene())
    print('ok')
