(function() {
    load_regions();

    drawChart('US', 'https://covidtracking.com/api/us/daily');
 })();

function sortByProperty(property){  
    return function(a,b){  
        if(a[property] > b[property])  
            return 1;  
        else if(a[property] < b[property])  
            return -1;  
    
        return 0;
    }
}

function load_regions(){
    let dropdown = $("#regions");
    var uri = "https://covidtracking.com/api/states/info";

    $.getJSON(uri)
        .done(function(data) {            
            let dropdown = $("#regions");
            dropdown.empty;
            
            dropdown.append($("<option></option>")
            .attr('value', 'US')
            .attr('data-url', 'https://covidtracking.com/api/us/daily')
            .text("US")); 

            data.sort(sortByProperty('state'));

            $.each(data, function(key, entry){
                var state_uri = "https://covidtracking.com/api/states/daily?state=" + entry.state;
                dropdown.append($("<option></option>")
                    .attr('value', entry.state)
                    .attr('data-url', state_uri)
                    .text(entry.state)); 
            });

            dropdown.change(function() {
                 let selected = $("#regions option:selected");                 
                 var url = selected.data('url')
                 drawChart(selected.val(), url);
            });
        });
}


function drawChart(region, uri){

    $.getJSON(uri)
        .done(function(data) {
            var neg_color = "blue";
            var pos_color = "red";
            var total_color = "silver";

            var parsed_data = [];
            parsed_data['date'] = { name: "Date" };
            parsed_data['states'] = { name: "States" };
            parsed_data['positive'] = { name: "Positive Results", color: pos_color};
            parsed_data['negative'] = { name: "Negative Results", color: neg_color };
            parsed_data['posneg'] = { name: "Total Positive/Negative" };
            parsed_data['pending'] = { name: "Total Pending "};
            parsed_data['hospitalized'] = { name: "Total Hospitalized" };
            parsed_data['death'] = { name: "Total Death" };
            parsed_data['total'] = { name: "Total Tests",color: total_color, type: "bar" };
            parsed_data['totalTestResults'] = { name: "Total Results", color: total_color, type: "bar" };
            parsed_data['deathIncrease'] = { name: "Death Increase" };
            parsed_data['hospitalizedIncrease'] = { name: "Hospitalized Increase" };
            parsed_data['negativeIncrease'] = { name: "Negative Increase", color: neg_color };
            parsed_data['positiveIncrease'] = { name: "Positive Increase", color: pos_color };
            parsed_data['totalTestResultsIncrease'] = { name: "Test Results Increase", color: total_color, type: "bar" };

            data.sort(sortByProperty("date"));
        
            for(var i = 0; i < data.length; i++){
                var data_obj = data[i];
                for(var key in data_obj){
                    // not grabbing meta keys, ignore them
                    if(parsed_data[key] !== undefined){                            
                        if(parsed_data[key]['data'] === undefined){
                            parsed_data[key]['data'] = [];
                        }

                        parsed_data[key]['data'].push(data_obj[key]);
                    }
                }
            }

            function build_trace(data_key){
                var data_obj = parsed_data[data_key];
                var obj = {};
                obj['marker']= {}

                obj['x'] = parsed_data['date']['data'].map(function(y){ 
                    var key = y.toString();
                    return new Date(key.substring(0,4), parseInt(key.substring(4,6)) - 1, key.substring(6,8));
                });

                obj['y'] = data_obj['data'];
                obj['name'] = data_obj['name'];
                
                if(data_obj['type'] !== undefined){
                    obj['type'] = data_obj['type'];
                }
                
                if(data_obj['color'] !== undefined){
                    obj['marker']['color'] = data_obj['color'];
                }

                return obj;
            };

            function build_layout(title){
                return {
                    title: region + ' ' + title,
                    showlegend: true
                }
            };

            var neg_trace = build_trace('negative');
            var neg_increase_trace = build_trace('negativeIncrease');

            var pending_trace = build_trace('pending');

            var pos_trace = build_trace('positive');
            var pos_increase_trace = build_trace('positiveIncrease');

            var total_trace = build_trace('total');
            var total_inc_trace = build_trace('totalTestResultsIncrease');

            Plotly.newPlot( $('#change_overtime')[0], [neg_increase_trace, pos_increase_trace, total_inc_trace], build_layout('Change Over Time'));
            Plotly.newPlot( $('#cumulativeresults')[0], [pos_trace, neg_trace, pending_trace, total_trace], build_layout('Cumulative'));
        }); 
}