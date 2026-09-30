"""SQLite: the database is a single file. Prismo tucks a small glass database file into a glass
phone, where it lives alongside the app."""
from kit import *

NAME = 'sqlite'

FW, FH, FOLD = 42, 54, 12  # the file: width, height, folded corner


def file_path_d(x, y):
    return (f'M{x + 5} {y} H{x + FW - FOLD} L{x + FW} {y + FOLD} V{y + FH - 5} Q{x + FW} {y + FH} {x + FW - 5} {y + FH} '
            f'H{x + 5} Q{x} {y + FH} {x} {y + FH - 5} V{y + 5} Q{x} {y} {x + 5} {y} Z')


def emblem(cx, top):
    """A tiny glass database: yellow, cyan and red discs under a silver lid."""
    rx, ry, h = 11, 3.4, 5.5
    sides, seams = [], []
    for i in range(3):
        y = top + i * h
        sides.append(f'<path d="M{cx - rx} {y} A{rx} {ry} 0 0 0 {cx + rx} {y} V{y + h} A{rx} {ry} 0 0 1 {cx - rx} {y + h} Z" fill="url(#sqlite-disc{i})"/>')
        if i:
            seams.append(f'<path d="M{cx - rx} {y} A{rx} {ry} 0 0 0 {cx + rx} {y}" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width=".8"/>')
    lid = f'<ellipse cx="{cx}" cy="{top}" rx="{rx}" ry="{ry}" fill="#f9fafc" stroke="#e3e8ef" stroke-width=".6"/>'
    return ''.join(reversed(sides)) + ''.join(seams) + lid


# gradients for the emblem's discs, as in the kit's glass database
DISC_DEFS = ''.join(
    f'<linearGradient id="sqlite-disc{i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{light}"/><stop offset="1" stop-color="{dark}"/></linearGradient>'
    for i, (light, dark) in enumerate(DISCS[1:]))


def glass_file(x, y):
    d = file_path_d(x, y)
    d2 = file_path_d(x, y + 2.5)
    fold = f'M{x + FW - FOLD} {y} V{y + FOLD - 3} Q{x + FW - FOLD} {y + FOLD} {x + FW - FOLD + 3} {y + FOLD} H{x + FW} Z'
    return f'''<g filter="url(#soft)">
      <path d="{d2}" fill="#dde2ea"/>
      <path d="{d}" fill="url(#glass)"/>
    </g>
    <path d="{d}" fill="url(#sweep)" fill-opacity=".2"/>
    <path d="{d}" fill="none" stroke="url(#prismEdge)" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="{fold}" fill="#e4e9f0" stroke="#c9d0da" stroke-width=".8" stroke-linejoin="round"/>
    {emblem(x + FW / 2 + 1, y + 17)}'''


def build():
    px, py, pw, ph, prx = 170, 82, 76, 128, 16  # the phone
    screen = (px + 5, py + 5, pw - 10, ph - 10)
    fx, fy = 188, 48  # the file, partly tucked in through the phone's top edge
    rows = ''.join(
        f'<circle cx="{screen[0] + 11}" cy="{y}" r="3.4" fill="{c}"/>'
        f'<rect x="{screen[0] + 19}" y="{y - 3}" width="{w}" height="6" rx="3" fill="#c6ccd6"/>'
        for y, w, c in ((py + 64, 34, YELLOW), (py + 80, 26, CYAN), (py + 96, 38, RED)))
    body = f'''  <!-- The phone, held at its left edge (the fingers are behind it) -->
{hand(169, 150, rot=20, part='body')}{glass_panel(px, py, pw, ph, rx=prx)}
  <!-- the file, going into the phone -->
{speed_lines(fx + FW / 2 + 1, fy - 6, dx=0, dy=-1, gap=6)}  {glass_file(fx, fy)}
  <!-- the phone's glass front, over the part of the file that is already inside, and its screen -->
  <g clip-path="url(#sqlite-phone)">
    <rect x="{screen[0]}" y="{screen[1]}" width="{screen[2]}" height="{screen[3]}" rx="12" fill="#eef2f6" fill-opacity=".85"/>
    <rect x="{px}" y="{py}" width="{pw}" height="{ph}" rx="{prx}" fill="url(#sweep)" fill-opacity=".08"/>
  </g>
  <circle cx="{px + pw - 15}" cy="{py + 13}" r="2.6" fill="#b3bcc8"/>
  <rect x="{screen[0] + 8}" y="{py + 42}" width="{screen[2] - 16}" height="9" rx="4.5" fill="#dfe4eb"/>
  {rows}
  <rect x="{px + pw / 2 - 12}" y="{py + ph - 11}" width="24" height="3.5" rx="1.75" fill="#b3bcc8"/>
  <rect x="{px + .75}" y="{py + .75}" width="{pw - 1.5}" height="{ph - 1.5}" rx="{prx - .75}" fill="none" stroke="url(#rim)" stroke-width="1.5"/>

{prismo(130, 102, tilt=3, face=6, eye_drop=-3)}
  <!-- the thumb on the phone's edge, and the hand that tucks the file in -->
{hand(169, 150, rot=20, part='thumb')}{hand(182, 58, rot=34, part='thumb')}{hand(182, 58, rot=34, part='body')}'''
    extra = f'  <defs>{DISC_DEFS}<clipPath id="sqlite-phone"><rect x="{px}" y="{py}" width="{pw}" height="{ph}" rx="{prx}"/></clipPath></defs>'
    return svg((80, 18, 190, 204), 'Prismo tucking a SQLite database file into a phone.', body, extra)
