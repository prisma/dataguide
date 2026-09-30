"""Serverless: Prismo pushes a function card (a λ) up into a glass cloud, where it runs."""
import math
from kit import *

NAME = 'serverless'


def cloud_path(circles, bottom, corner=10):
    """The outline of a cloud: the tops of `circles` (cx, cy, r), left to right, each overlapping
    the next, over a flat bottom at y = `bottom` with rounded corners."""
    def upper_hit(a, b):
        (x0, y0, r0), (x1, y1, r1) = a, b
        d = math.hypot(x1 - x0, y1 - y0)
        l = (r0 ** 2 - r1 ** 2 + d ** 2) / (2 * d)
        h = math.sqrt(r0 ** 2 - l ** 2)
        mx, my = x0 + l * (x1 - x0) / d, y0 + l * (y1 - y0) / d
        p1 = (mx + h * (y1 - y0) / d, my - h * (x1 - x0) / d)
        p2 = (mx - h * (y1 - y0) / d, my + h * (x1 - x0) / d)
        return min(p1, p2, key=lambda p: p[1])

    def base_hit(c, side):
        x, y, r = c
        dy = bottom - corner - y
        return x + side * math.sqrt(r ** 2 - dy ** 2), bottom - corner

    pts = [base_hit(circles[0], -1)]
    pts += [upper_hit(a, b) for a, b in zip(circles, circles[1:])]
    pts.append(base_hit(circles[-1], 1))
    d = f'M{pts[0][0]:.1f} {pts[0][1]:.1f}'
    for c, p in zip(circles, pts[1:]):
        d += f' A{c[2]} {c[2]} 0 0 1 {p[0]:.1f} {p[1]:.1f}'
    x_right, x_left = pts[-1][0], pts[0][0]
    d += (f' Q{x_right:.1f} {bottom} {x_right - corner:.1f} {bottom}'
          f' H{x_left + corner:.1f} Q{x_left:.1f} {bottom} {x_left:.1f} {bottom - corner} Z')
    return d


def lam(stroke, width=3.2):
    """A λ drawn with strokes, in a 20 x 22 box."""
    return (f'<path d="M3 1.5 C6.5 1.5 8 3 9.5 6.5 L17.5 20.5 M10.2 9.5 L3 20.5" fill="none" '
            f'stroke="{stroke}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"/>')


def bolt(x, y, s=1):
    """A glass lightning bolt with its top at (x, y)."""
    d = 'M0 0 L-13 26 H-3 L-9 46 L13 17 H3 L10 0 Z'
    return f'''<g transform="translate({x} {y}) scale({s})" filter="url(#soft)">
    <path d="{d}" fill="url(#serverless-bolt)" stroke-linejoin="round"/>
    <path d="{d}" fill="url(#sweep)" fill-opacity=".15"/>
    <path d="{d}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.2" stroke-linejoin="round"/>
  </g>'''


def build():
    bottom = 100
    circles = [(150, 82, 22), (186, 52, 32), (240, 34, 44), (300, 44, 38), (344, 72, 30)]
    outline = cloud_path(circles, bottom)
    card = glass_slab(54, 45, 10, f'<g transform="translate(16 12) scale(1.15)">{lam(CYAN, 3.4)}</g>')
    card_at = 'translate(160 89) rotate(8)'
    extra = f'''  <clipPath id="serverless-outside">
    <path d="M0 -40 H400 V260 H0 Z {outline}" clip-rule="evenodd"/>
  </clipPath>
  <linearGradient id="serverless-bolt" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f8d64a"/><stop offset="1" stop-color="#d9a800"/>
  </linearGradient>
  <clipPath id="serverless-inside"><path d="{outline}"/></clipPath>'''
    body = f'''  <!-- The cloud: a glass shape that bleeds off the top and right edges -->
  <g filter="url(#soft)">
    <path d="{outline}" transform="translate(0 3)" fill="#d9dee6"/>
    <path d="{outline}" fill="url(#glass)"/>
  </g>
  <path d="{outline}" fill="url(#sweep)" fill-opacity=".14"/>
  <!-- the function lights up the cloud where it goes in -->
  <g clip-path="url(#serverless-inside)">
    <ellipse cx="186" cy="97" rx="26" ry="8" fill="{CYAN}" fill-opacity=".3" filter="url(#blur6)"/>
    <g transform="{card_at}" opacity=".35">{card}</g>
  </g>
  {bolt(262, 34)}
  <path d="{outline}" fill="none" stroke="url(#prismEdge)" stroke-opacity=".7" stroke-width="1.5"/>
  <path d="{outline}" transform="translate(1.5 1.5)" fill="none" stroke="url(#rim)" stroke-width="1.5"/>

{prismo(104, 100, tilt=3, face=6, eye_drop=2)}
  <!-- the card, pushed up into the cloud: one hand lifts it from below, the other holds its edge -->
  <g transform="rotate(8 210 153)">{speed_lines(210, 153, dx=0, dy=1, gap=6)}</g>
{hand(184, 145, rot=-84, part='body')}  <g clip-path="url(#serverless-outside)">
    <g transform="{card_at}" filter="url(#soft)">
      {card}
    </g>
  </g>
{hand(184, 145, rot=-84, part='thumb')}{hand(153, 108, rot=8)}'''
    return svg((60, 0, 262, 190), 'Prismo deploying a function to a serverless cloud.', body, extra)
