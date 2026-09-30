"""Introduction to databases: Prismo drops a record into a glass database."""
from kit import *

NAME = 'intro'


def build():
    cx, top = 196, 104  # the database bleeds off the right edge
    database, _ = glass_database(cx, top, opening=True)
    record_cells = (f'<circle cx="12" cy="11" r="4" fill="{YELLOW}"/>'
                    f'<rect x="22" y="7" width="26" height="8" rx="4" fill="{CYAN}" fill-opacity=".8"/>'
                    f'<rect x="10" y="21" width="38" height="7" rx="3.5" fill="{RED}" fill-opacity=".6"/>')
    clip = f'''  <clipPath id="aboveRim">
    <rect x="0" y="0" width="260" height="{top}"/>
    <ellipse cx="{cx}" cy="{top}" rx="48" ry="11"/>
  </clipPath>'''
    body = f'''  <!-- The database -->
{database}
{prismo(106, 100, tilt=3, face=5, eye_drop=-1)}
  <!-- the record, dropping into the opening; the hand holds its top-left corner -->
{speed_lines(186, 67, dx=0, dy=-1, gap=6)}{hand(166, 74, rot=14, part='thumb')}  <g clip-path="url(#aboveRim)">
    <g transform="translate(164 70) rotate(14)" filter="url(#soft)">
      {glass_slab(58, 34, 8, record_cells)}
    </g>
  </g>
{opening_front(cx, top)}{hand(166, 74, rot=14, part='body')}  <!-- the other hand rests on the database's rim -->
{hand(150, 114, rot=8)}'''
    return svg((58, 34, 192, 186), 'Prismo storing a record in a database.', body, clip)
