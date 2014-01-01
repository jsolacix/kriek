function RaspBrew() {
	var _this = this;
	
	var lastData = null;
	
	this.colourList = ['#DD6E2F','#DD992F','#285890','#1F9171','#7A320A','#7A4F0A','#082950','#06503C'];
	
	// This is constantly called to update the data via ajax.
	this.updateStatus = function() {
		
		var url = '/status/50';
		
		var startDateEnabled = $("#startDate").attr('disabled') !== undefined && !$("#startDate").is(":focus");
		var endDateEnabled = $("#endDate").attr('disabled') !== undefined && !$("#endDate").is(":focus");
		
		if (startDateEnabled || endDateEnabled) {
			var sd = null;
			var ed = (new Date).getTime();
			
			startDateValue = $("#startDate").val();
			if (startDateValue) {
				sd = new Date($("#startDate").datetimepicker('getDate'));
				url = url + '/' + parseInt(sd.getTime()/1000);
				
				endDateValue = $("#endDate").val();
				if (endDateEnabled && endDateValue) {
					ed = new Date($("#endDate").datetimepicker('getDate'));
					url = url + '/' + parseInt(ed.getTime()/1000);
				}
			}
		}
		
		$.ajax({
			url: url,
			type: 'GET',
			dataType: 'json',
			success: function(data){ 
				if (data) {
					_this.updateFromData(data);
				}
				
				setTimeout(_this.updateStatus, 1000);
			},
			error: function(data) {
				//alert('woops!'); //or whatever
				setTimeout(_this.updateStatus, 1000);
			}
		});
	};
	
	// Updates the UI as needed
	this.updateFromData = function(data) {
	
		//we are waiting for the server to update the data
		if (this._writingData) {
			return;
		}
	
		if (!data || data.length==0) {
			$('.raspbrew_updateable').html('--');
			this.emptyChart();
			return;
		}
		
		var latest = data[0];
		for (var probeid in latest.probes) {
			var probe = latest.probes[probeid];
			var tempInput = $('#probe' + probeid + '_temp');
			var ttempInput = $('#probe' + probeid + '_target');
			
			if (! tempInput.is(":focus"))
				tempInput.html(parseFloat(probe.temp).toFixed(2));
			if (! ttempInput.is(":focus") && ! ttempInput.parent().hasClass('has-success')) {
				if (probe.target_temp) {
					ttempInput.val(parseFloat(probe.target_temp).toFixed(2));
				} else {
					ttempInput.val("");
				}
			}
		}
		
		for (var ssrid in latest.ssrs) {
			var ssr = latest.ssrs[ssrid];
			if (! $('#ssr' + ssrid).is(":focus")) {
				$('#ssr' + ssrid).removeClass("powerOff");
				if (ssr.state) {
					$('#ssr' + ssrid).addClass("power");
				} else {
					$('#ssr' + ssrid).addClass("powerOff");
				}
			}
		}
		
		//update the chart
		_this.updateChart(data);
	}
	
	// Clears out the chart if there's no data
	this.emptyChart = function() {
		if (this.chart) {
			var datum = this.lastData;
			if (datum) {
				for (var i=0;i<datum.length;i++) {
					datum[i].values = [{x:0,y:0}];
				}
			} else {
				datum = [ 
					{ 
					  "key" : "" , 
					  "values" : []
					}

				]
			}
			//update the chart
			d3.select('#tempChart svg')
			.datum(datum)
			.transition().duration(500)
			.call(this.chart);
		}
	}
	
	// Updates the chart with the current data set
	this.updateChart = function(data) {
		  
		var dd = {};
		var values = [];

		for (var i = 0; i < data.length; i++) {
			var d = data[i];
			for (var probeid in d.probes) {
				var probe = d.probes[probeid];
				if (!dd[probeid]) {
					dd[probeid] = []
				}
				var date = new Date(parseInt(d.date)*1000)
	
				dd[probeid].push({x: date, y: probe.temp});
			}
		}

		var datum=[];
		var d = data[0];
		var count=0;
		for (var probeid in dd) {
			datum.push({ values: dd[probeid], key: d.probes[probeid].name, color:this.colourList[count++] });
		}
		
		this.lastData = datum;
		
		if (this.chart) {
			//update the chart
			d3.select('#tempChart svg')
			.datum(datum)
			.transition().duration(500)
			.call(this.chart);
		}
	
	}
	
	//create the chart
	this.createChart = function() {
		var _this = this;
		  
		nv.addGraph(function() {
		  _this.chart = nv.models.lineChart()
		  .options({
			//margin: {left: 100, bottom: 100},
			showXAxis: true,
			showYAxis: true,
			//transitionDuration: 250
		  })
		  ;

		  // chart sub-models (ie. xAxis, yAxis, etc) when accessed directly, return themselves, not the parent chart, so need to chain separately
		  _this.chart.xAxis
			.axisLabel("Time (s)")
			.tickFormat(function(d) {
				//why do i have to do this??
				return d3.time.format("%H:%M:%S")(new Date(d));
			})
			
		  _this.chart.yAxis
			.axisLabel('Temperature (c)')
			.tickFormat(d3.format(',.2f'));

		  nv.utils.windowResize(_this.chart.update);

		  _this.chart.dispatch.on('stateChange', function(e) { nv.log('New State:', JSON.stringify(e)); });

		  return _this.chart;
		});
	}
	
	//sets the time - starttime and endtime are both moment objects
	this.quickTime = function(startTime, endTime) {
		$('#startDateCheckbox').prop('checked', true);
		$('#endDateCheckbox').prop('checked', true);
		$('#startDate').prop('disabled', false);
		$('#endDate').prop('disabled', false);
		$("#startDate").datetimepicker('setDate', startTime.toDate() );
		$("#endDate").datetimepicker('setDate', endTime.toDate() );
	}
	
	//updates the target temperature of the given probe id
	this.updateTargetTemp = function(input, probeid) {
	
		input=$('#'+input)
		$(input).parent().removeClass('has-success');
		
		//todo.. gotta validate the input
		var val=input.val();
		var val=parseFloat(val);
		if (isNaN(val) || val > 999) {
			input.parent().addClass('has-error');
			return;
		} 
		
		val=val.toFixed(2);
		input.val(val);
		
		var _this = this;
		this._writingData = true;
		
		var post = { probes: [ { pk: probeid, target_temperature: input.val() } ]  };
		
		$.post( "/update", "json=" + JSON.stringify(post) , function( data ) {
		  _this._writingData = false;
		}, "json");
	}


	$( document ).ready(function() {
		_this.createChart();
		_this.updateStatus();
		
		$("#startDate").datetimepicker();
		$("#endDate").datetimepicker();
	});
	
	return this;
};

var raspbrew = new RaspBrew();

