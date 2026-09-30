"""The shared drawing kit for the section artwork: Prismo, his hands, glass objects and the
brand colours. Every scene uses the same materials and lighting: key light from the upper left
(cool), warm fill from the right, and the same soft drop shadow on every object."""
import pathlib

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


def glass_panel(x, y, w, h, rx=18):
    """A glass panel (a table, a dashboard, a screen): thickness, rim highlight, prism sweep."""
    return f'''  <g filter="url(#soft)">
    <rect x="{x}" y="{y + 3}" width="{w}" height="{h}" rx="{rx}" fill="#d9dee6"/>
    <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="url(#glass)" stroke="#e3e8ef"/>
  </g>
  <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="url(#sweep)" fill-opacity=".07"/>
  <rect x="{x + .75}" y="{y + .75}" width="{w - 1.5}" height="{h - 1.5}" rx="{rx - .75}" fill="none" stroke="url(#rim)" stroke-width="1.5"/>
'''


# Discs of the brand's glass database render, from the top: silver, yellow, cyan, red
DISCS = [('#f9fafc', '#c9d0da'), ('#f8d64a', '#d9a800'), ('#6be9f0', '#00aebb'), ('#f7788a', '#d8324a')]


def glass_database(cx, top, rx=62, ry=15, heights=(20, 26, 26, 26), opening=False, uid='db'):
    """The glass database. Returns (svg, bottom) where `bottom` is the y of the lowest disc's
    front edge. With `opening`, the lid has a recessed opening with a prism ring (use
    `opening_front` afterwards to draw the rim in front of anything dropped into it). `uid` keeps
    gradient ids unique when a scene has more than one database."""
    grads, sides, seams = [], [], []
    y = top
    for i, h in enumerate(heights):
        light, dark = DISCS[i % len(DISCS)]
        grads.append(f'<linearGradient id="{uid}-disc{i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{light}"/><stop offset="1" stop-color="{dark}"/></linearGradient>')
        sides.append(f'<path d="M{cx - rx} {y} A{rx} {ry} 0 0 0 {cx + rx} {y} V{y + h} A{rx} {ry} 0 0 1 {cx - rx} {y + h} Z" fill="url(#{uid}-disc{i})" fill-opacity=".9"/>')
        if i:
            seams.append(f'<path d="M{cx - rx} {y} A{rx} {ry} 0 0 0 {cx + rx} {y}" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.2"/>')
        y += h
    bottom = y
    body = f'M{cx - rx} {top} V{bottom} A{rx} {ry} 0 0 0 {cx + rx} {bottom} V{top} Z'
    lid = ''
    if opening:
        orx, ory = rx - 14, ry - 4
        lid = f'''
  <ellipse cx="{cx}" cy="{top}" rx="{orx}" ry="{ory}" fill="#cfd6df"/>
  <ellipse cx="{cx}" cy="{top - 3}" rx="{orx - 6}" ry="{max(ory - 4, 2)}" fill="#8f9aa8" fill-opacity=".55" filter="url(#blur2)"/>
  <ellipse cx="{cx}" cy="{top}" rx="{orx}" ry="{ory}" fill="none" stroke="url(#prismEdge)" stroke-width="1.5"/>'''
    svg_ = f'''  <defs>{''.join(grads)}</defs>
  <g filter="url(#soft)">
    {''.join(reversed(sides))}
    {''.join(seams)}
    <ellipse cx="{cx}" cy="{top}" rx="{rx}" ry="{ry}" fill="#f9fafc" stroke="#e3e8ef"/>
  </g>
  <path d="{body}" fill="url(#sweep)" fill-opacity=".07"/>
  <path d="M{cx - rx + .75} {bottom} V{top}" fill="none" stroke="url(#rim)" stroke-width="1.5"/>
  <ellipse cx="{cx - rx * .48:g}" cy="{top + 16}" rx="{rx * .23:g}" ry="4" fill="#fff" fill-opacity=".7" filter="url(#blur2)"/>{lid}
'''
    return svg_, bottom


def opening_front(cx, top, rx=62, ry=15):
    """The front half of a glass database's opening ring, drawn over things dropped into it."""
    orx, ory = rx - 14, ry - 4
    return f'  <path d="M{cx - orx} {top} A{orx} {ory} 0 0 0 {cx + orx} {top}" fill="none" stroke="url(#prismEdge)" stroke-width="1.5"/>\n'


def svg(view_box, comment, body, extra_defs=''):
    """Wraps a scene. `view_box` is (x, y, width, height): crop it to the scene's content."""
    x, y, w, h = view_box
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="{x} {y} {w} {h}">
  <!-- {comment} Drawn in the Prisma brand style (see README.md).
       Generated by generate.py; don't edit by hand. -->
{DEFS}
{extra_defs}
{body}</svg>
'''
