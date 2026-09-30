"""MySQL: replication. Prismo guides a row from a primary database across to a smaller replica,
along a dashed path."""
from kit import *

NAME = 'mysql'


def build():
    # Prismo stands between the replica (left, smaller) and the primary (right, bleeding off the
    # right edge) and carries a row over from one to the other
    pcx, ptop, prx, pry = 258, 78, 56, 14
    rcx, rtop, rrx, rry = 88, 126, 32, 8
    primary, _ = glass_database(pcx, ptop, rx=prx, ry=pry, heights=(18, 24, 24, 24), opening=True, uid='mysql-primary')
    replica, _ = glass_database(rcx, rtop, rx=rrx, ry=rry, heights=(9, 13, 13, 13), opening=True, uid='mysql-replica')
    # the route: out of the primary's opening, over Prismo and down into the replica's
    route = f'M{pcx} {ptop} Q162 -18 {rcx} {rtop}'
    row_cells = (f'<circle cx="10" cy="10" r="3.8" fill="{YELLOW}"/>'
                 f'<rect x="19" y="6.5" width="14" height="7" rx="3.5" fill="{CYAN}" fill-opacity=".8"/>'
                 f'<rect x="37" y="6.5" width="12" height="7" rx="3.5" fill="{RED}" fill-opacity=".7"/>')
    body = f'''  <!-- The replica and the primary -->
{replica}{primary}
  <!-- the route the row takes -->
  <path d="{route}" fill="none" stroke="{CYAN}" stroke-opacity=".75" stroke-width="1.5" stroke-dasharray="4 4" stroke-linecap="round"/>

{prismo(160, 124, tilt=-3, face=-4, eye_drop=-4)}
  <!-- the row, carried over to the replica; the other hand rests on the primary -->
{speed_lines(194, 31, dx=1, dy=-.35)}{hand(153, 60, rot=-78, part='body')}  <g transform="translate(130 42) rotate(-18)" filter="url(#soft)">
    {glass_slab(56, 20, 7, row_cells)}
  </g>
{hand(153, 60, rot=-78, part='thumb')}{hand(206, 90, rot=-6)}'''
    return svg((44, 12, 256, 194), 'Prismo replicating a row from a primary database to a replica.', body)
