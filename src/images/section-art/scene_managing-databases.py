"""Managing databases: Prismo puts his finger on a spike in a glass monitoring dashboard, with
his other hand on the database it monitors."""
import math
from kit import *

NAME = 'managing-databases'


def gauge(cx, cy, r, value):
    """A half-circle gauge in the prism colours with a needle at `value` (0 = left, 1 = right)."""
    def pt(t, rr):
        a = math.pi * (1 - t)
        return cx + rr * math.cos(a), cy - rr * math.sin(a)
    segs = []
    for (t0, t1), color in zip(((0, .36), (.36, .68), (.68, 1)), (CYAN, YELLOW, RED)):
        (x0, y0), (x1, y1) = pt(t0 + .015, r), pt(t1 - .015, r)
        segs.append(f'<path d="M{x0:.1f} {y0:.1f} A{r} {r} 0 0 1 {x1:.1f} {y1:.1f}" fill="none" stroke="{color}" stroke-width="5" stroke-linecap="round"/>')
    nx, ny = pt(value, r - 7)
    return f'''<path d="M{cx - r} {cy} A{r} {r} 0 0 1 {cx + r} {cy}" fill="none" stroke="#e1e6ee" stroke-width="9" stroke-linecap="round"/>
  {''.join(segs)}
  <path d="M{cx} {cy} L{nx:.1f} {ny:.1f}" stroke="#5f6a79" stroke-width="2.4" stroke-linecap="round"/>
  <circle cx="{cx}" cy="{cy}" r="4.2" fill="url(#mitt)" stroke="#8f9aa8" stroke-width=".7"/>'''


def build():
    # The dashboard bleeds off the top and right edges
    px, py, pw, ph = 150, -14, 230, 214
    # chart area
    cx0, cy0, cw, ch = 164, 30, 200, 92
    base = cy0 + ch - 14
    # a calm line with one spike
    pts = [(cx0 + 6, base - 8), (cx0 + 14, base - 12), (cx0 + 22, base - 6), (cx0 + 32, base - 10),
           (cx0 + 42, cy0 + 16),  # the spike
           (cx0 + 53, base - 8), (cx0 + 68, base - 14), (cx0 + 82, base - 8), (cx0 + 96, base - 16),
           (cx0 + 112, base - 11), (cx0 + 128, base - 18), (cx0 + 144, base - 12), (cx0 + 162, base - 20),
           (cx0 + 180, base - 14), (cx0 + 200, base - 18)]
    line = 'M' + ' L'.join(f'{x} {y}' for x, y in pts)
    area = line + f' L{pts[-1][0]} {base + 6} L{pts[0][0]} {base + 6} Z'
    sx, sy = pts[4]
    grid = ''.join(f'M{cx0 + 6} {y}H{cx0 + cw}' for y in (cy0 + 26, cy0 + 50, base + 6))
    dcx, dtop = 170, 138
    database, _ = glass_database(dcx, dtop, rx=28, ry=7.5, heights=(10, 12, 12, 12), uid='managing-databases-db')
    body = f'''  <!-- The dashboard: a glass panel with a header, a line chart and a gauge -->
{glass_panel(px, py, pw, ph)}  <circle cx="{px + 20}" cy="{py + 30}" r="4" fill="{CYAN}"/>
  <rect x="{px + 30}" y="{py + 26}" width="40" height="8" rx="4" fill="#9aa3b1"/>
  <rect x="{px + 78}" y="{py + 26}" width="26" height="8" rx="4" fill="#c6ccd6"/>
  <rect x="{cx0}" y="{cy0}" width="{cw}" height="{ch}" rx="10" fill="#eef1f6"/>
  <path d="{grid}" stroke="#e1e6ee" stroke-width="1.5"/>
  <path d="{area}" fill="{CYAN}" fill-opacity=".14"/>
  <path d="{line}" fill="none" stroke="{CYAN}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M{pts[3][0]} {pts[3][1]} L{sx} {sy} L{pts[5][0]} {pts[5][1]}" fill="none" stroke="{RED}" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"/>
  <circle cx="{sx}" cy="{sy}" r="9" fill="{RED}" fill-opacity=".16"/>
  <circle cx="{sx}" cy="{sy}" r="4" fill="{RED}"/>
  <!-- the gauge, reading high, and a row of status pills -->
  {gauge(246, 168, 24, .8)}
  <rect x="284" y="146" width="50" height="8" rx="4" fill="#c6ccd6"/>
  <rect x="284" y="162" width="36" height="8" rx="4" fill="#c6ccd6"/>
  <!-- the database it monitors, in front of the dashboard -->
{database}
{prismo(114, 82, tilt=-3, face=6, eye_drop=-3)}
  <!-- the front hand puts a finger on the spike; the back hand rests on the database -->
{hand(sx - 22, sy + 3, rot=-8)}{hand(150, 136, rot=24)}'''
    return svg((62, 0, 268, 210), 'Prismo spotting a spike on a monitoring dashboard.', body)
