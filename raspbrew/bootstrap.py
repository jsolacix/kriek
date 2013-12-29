#!../env-raspbrew/bin/python
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "raspbrew.settings")

from raspbrew.common.models import Probe,Status,SSR,GlobalSettings

probe=Probe(one_wire_Id='28-00000449e4f6',name='HLT',type=2)
probe.save()
ssr=SSR(name='HLT SSR', pin=22, heater_or_chiller=1, probe=probe)
ssr.save()

probe=Probe(one_wire_Id='28-0000044a00b2',name='Boil',type=1)
probe.save()
ssr=SSR(name='Boil SSR', pin=23, heater_or_chiller=0, probe=probe)
ssr.save()

probe=Probe(one_wire_Id='28-00000449ef31',name='Mash',type=0)
probe.save()

g=GlobalSettings(key='UNITS', value='metric')
g.save()

#probes=Probe.objects.all()
#current=CurrentStatus.create()
#current.save()

#print current.status




