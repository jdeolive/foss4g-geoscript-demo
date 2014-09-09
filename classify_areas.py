from geoserver.wps import process
from geoserver.catalog import Layer
from geoscript.geom import Geometry

@process(
  inputs = {
    'area': (Geometry, 'The area to classify')
  }, 
  outputs = {
    'result': (dict, 'The classified result')
  },
  title='Classify Protected Areas',
  description='Classifies protected areas covering a specific area.'
)
def run(area):
  padus = Layer('oregon:padus').data

  total_area = 0
  results = {}

  for f in padus.features('INTERSECTS(%s, %s)' % ('the_geom', area)):
    land_type = f['Own_Type']
    land_area = f.geom.intersection(area).area

    if land_type not in results:
      results[land_type] = 0;

    results[land_type] += land_area
    total_area += land_area

  return {'result': 
    dict([(k,round(100 * v/total_area, 2)) for k,v in results.iteritems()])}
