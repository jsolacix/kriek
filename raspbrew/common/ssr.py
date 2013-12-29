##
## a class for turning on an SSR
##
#import RPi.GPIO as GPIO
import wiringpi
import time
from pprint import pprint
from threading import Thread

class SSR(Thread):
	def __init__(self, ssr):
		self.ssr = ssr
		
		Thread.__init__(self)
		#wiringpi.wiringPiSetupGpio()
		#wiringpi.pinMode(ssr.pin,1) 
		
		self.daemon = True
		self.duty_cycle = 0
		self.cycle_time = 0
		self.power = 100
		self.enabled = False
		self._On = False
		
	def setEnabled(self, enabled):
		#print "Enabled: " + str(enabled) + " on pin: " + str(self.ssr.pin)
		self.enabled = enabled

	def isEnabled(self):
		return self.enabled	
	
	def run(self):
		while True:
			if self.enabled:
				self.fireSSR()
			else:
				self._On = False
				#wiringpi.digitalWrite(self.ssr.pin,0)
				time.sleep(2)
				#print str(self.ssr.pin) + " OFF!!"

	def getonofftime(self, cycle_time, duty_cycle):
		duty = duty_cycle/100.0
		on_time = cycle_time*(duty)
		off_time = cycle_time*(1.0-duty)   
		return [on_time, off_time]
		
	#updates the duty/cycle time
	def updateSSR(self, duty_cycle, cycle_time):
		if self.duty_cycle != duty_cycle or self.cycle_time != cycle_time:
			self.duty_cycle = duty_cycle
			self.cycle_time = cycle_time
							
	def fireSSR(self):
		#self.duty_cycle = duty_cycle;
		print "Fire: " + str(self.enabled) + " " + str(self.ssr.pin) + " " + str(self.power) + " " + str(self.duty_cycle) + " " + str(self.cycle_time)
		
		if self.power < 100 or self.duty_cycle < 100:
			if self.power < 100:
				on_time, off_time = self.getonofftime(self.cycle_time, self.power)
			elif self.duty_cycle < 100:
				on_time, off_time = self.getonofftime(self.cycle_time, self.duty_cycle)

			if (on_time > 0):
				#print str(self.ssr.pin) + " ON for: " + str(on_time)
				#wiringpi.digitalWrite(self.ssr.pin,1)
				self._On = True
				time.sleep(on_time)

			#print str(self.GPIOPin) + " OFF"
			#wiringpi.digitalWrite(self.ssr.pin,0)
			self._On = False
			time.sleep(off_time)
		elif self.duty_cycle == 100:
			#print str(self.ssr.pin) + " ON"
			self._On = True
			#wiringpi.digitalWrite(self.ssr.pin,1)
			time.sleep(self.cycle_time)	
		else:
			#print str(self.ssr.pin) + " OFF"
			self._On = False
			#wiringpi.digitalWrite(self.ssr.pin,0)
			time.sleep(self.cycle_time)			


	#sets the power for this ssr from 1-100
	def setPower(self, newpower):
		self.power = float(newpower)
		
	#get the power for this ssr from 1-100
	def getPower(self):
		return float(self.power);
		
	def getState(self):
		ret=0
		if self._On:
			ret=1
		return ret
		
	def setState(self, state):
		self._On = state