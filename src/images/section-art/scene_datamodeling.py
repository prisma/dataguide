"""Data modeling: Prismo slides a tuple (a row) into the empty slot of a glass table."""
from kit import *

NAME = 'datamodeling'


def build():
    # The table bleeds off the top and right edges
    px, py, pw, ph = 150, -14, 240, 222
    rows_y = [60, 86, 112, 164, 190]  # row centre lines; the slot is at 138
    slot_y = 138
    col = [190, 222, 282]
    widths = [(34, 58), (42, 50), (30, 62), (28, 60), (38, 48)]
    cells = ''.join(
        f'<circle cx="{col[0] - 6}" cy="{y}" r="4.3" fill="{YELLOW}"/>'
        f'<rect x="{col[1] + 6}" y="{y - 4}" width="{w1}" height="8" rx="4" fill="#c6ccd6"/>'
        f'<rect x="{col[2] + 6}" y="{y - 4}" width="{w2}" height="8" rx="4" fill="#c6ccd6"/>'
        for (w1, w2), y in zip(widths, rows_y))
    lines = ''.join(f'M{px + 14} {y}H{px + pw - 14}' for y in [73, 99, 125, 151, 177])
    tuple_cells = (f'<circle cx="14" cy="11" r="4.3" fill="{YELLOW}"/>'
                   f'<rect x="28" y="7" width="30" height="8" rx="4" fill="{CYAN}" fill-opacity=".8"/>'
                   f'<rect x="66" y="7" width="40" height="8" rx="4" fill="{RED}" fill-opacity=".7"/>')
    body = f'''  <!-- The table: a glass panel with a header row, rows and an empty slot -->
{glass_panel(px, py, pw, ph)}  <rect x="{px + 14}" y="{py + 32}" width="{pw - 28}" height="24" rx="7" fill="#eef1f6"/>
  <rect x="{col[0] - 12}" y="{py + 40}" width="14" height="8" rx="4" fill="#9aa3b1"/>
  <rect x="{col[1] + 6}" y="{py + 40}" width="40" height="8" rx="4" fill="#9aa3b1"/>
  <rect x="{col[2] + 6}" y="{py + 40}" width="56" height="8" rx="4" fill="#9aa3b1"/>
  <path d="M{col[1]} 48V196M{col[2]} 48V196" stroke="#e1e6ee" stroke-width="1.5"/>
  <path d="{lines}" stroke="#e1e6ee" stroke-width="1.5"/>
  {cells}
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
{hand(146, 130, rot=4)}'''
    return svg((64, 0, 296, 220), 'Prismo placing a tuple (a row) into a table.', body)
