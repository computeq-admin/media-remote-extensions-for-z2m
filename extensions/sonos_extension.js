class my_sonos_control {
    constructor(zigbee, mqtt, state, publishEntityState, eventBus, settings, logger) {
        logger.info('Loaded my_sonos_control');
        mqtt.publish('example/extension', 'hello from my_sonos_control');
        this.mqttBaseTopic = settings.get().mqtt.base_topic;
        this.eventBus = eventBus;
        this.mqtt = mqtt;
        this.eventBus.on('stateChange', this.onStateChange.bind(this), this.constructor.name);
        
        //logger
        this.logger = logger;
        
        //local values for Sonos
        this.sonos_ip_for_control = {};
        this.sonos_volume_step = {};
        //-----------------------------------
        //Configure here
        //-----------------------------------
        // example
        this.sonos_ip_for_control["0x1234567890abcdef"] = '192.168.x.y'; 
        this.sonos_volume_step["0x1234567890abcdef"] = '2'; 
        //-----------------------------------
        //End of configuration
        //-----------------------------------
    }

    async onStateChange(data) {

        //Sonos uPNP Envelope
        var soap_envelope = function(body) {
            return '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body>'+body+'</s:Body></s:Envelope>';
        }

        function call_sonos_toggle (the_object, the_ip) {
            var the_type = 'urn:schemas-upnp-org:service:AVTransport:1';
            var the_path = '/MediaRenderer/AVTransport/Control';
            var the_action = 'GetTransportInfo';
            
            var body = '<u:'+the_action+' xmlns:u="'+the_type+'">';
            body += '<InstanceID>0</InstanceID>';
            body += '</u:'+the_action+'>';
            
            var the_message = soap_envelope(body);

            var http = require('http');  
            
            //the_object.logger.info("hier"+the_ip+ ' -> ' + the_action);
            var soap_action = the_type + '#' + the_action;
            var the_headers = {
                'Content-Type': 'text/xml; charset="utf-8"',
                'SOAPACTION': soap_action,
                'Content-Length': the_message.length,
            }
            // An object of options to indicate where to post to
            var post_options = {
                host: the_ip,
                port: 1400,
                path: the_path,
                method: 'POST',
                headers: the_headers
            };
            
            // Set up the request
            var post_req = http.request(post_options, function(res) {
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    //the_object.logger.info("hier3"+chunk);
                    if ( chunk.includes('PLAYING') ) {
                        call_sonos_s2_stop (the_object, the_ip);   
                    } else {
                        call_sonos_s2_play (the_object, the_ip);            
                    }
                });
            });
            
            // post the data
            post_req.write(the_message);
            post_req.end();
        }

        function call_sonos_upnp (the_object, the_ip, the_message, the_type, the_action, the_path) {

            var http = require('http');  
            
            //the_object.logger.info("hier"+the_ip+ ' -> ' + the_action);
            var soap_action = the_type + '#' + the_action;
            var the_headers = {
                'Content-Type': 'text/xml; charset="utf-8"',
                'SOAPACTION': soap_action,
                'Content-Length': the_message.length,
            }
            // An object of options to indicate where to post to
            var post_options = {
                host: the_ip,
                port: 1400,
                path: the_path,
                method: 'POST',
                headers: the_headers
            };
            
            // Set up the request
            var post_req = http.request(post_options, function(res) {
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    //console.log('Response: ' + chunk);
                    //the_object.logger.info("REsponse:"+chunk);
                });
            });
            
            // post the data
            post_req.write(the_message);
            post_req.end();

        }

        function call_sonos_s2_relative_volume (the_object, the_ip, the_adjustment) {
            var the_type = 'urn:schemas-upnp-org:service:RenderingControl:1';
            var the_path = '/MediaRenderer/RenderingControl/Control';
            var the_action = 'SetRelativeVolume';
            
            var body = '<u:'+the_action+' xmlns:u="'+the_type+'">';
            body += '<InstanceID>0</InstanceID>';
            body += '<Channel>Master</Channel>';
            body += '<Adjustment>' + the_adjustment + '</Adjustment>';
            body += '</u:'+the_action+'>';
            
            var the_message = soap_envelope(body);
            
            call_sonos_upnp (the_object, the_ip, the_message, the_type, the_action, the_path);
        }

        function call_sonos_s2_play (the_object, the_ip) {
            var the_type = 'urn:schemas-upnp-org:service:AVTransport:1';
            var the_path = '/MediaRenderer/AVTransport/Control';
            var the_action = 'Play';
            
            var body = '<u:'+the_action+' xmlns:u="'+the_type+'">';
            body += '<InstanceID>0</InstanceID>';
            body += '<Speed>1</Speed>';
            body += '</u:'+the_action+'>';
            
            var the_message = soap_envelope(body);
            
            call_sonos_upnp (the_object, the_ip, the_message, the_type, the_action, the_path);
        }

        function call_sonos_s2_stop (the_object, the_ip) {
            var the_type = 'urn:schemas-upnp-org:service:AVTransport:1';
            var the_path = '/MediaRenderer/AVTransport/Control';
            var the_action = 'Stop';
            
            var body = '<u:'+the_action+' xmlns:u="'+the_type+'">';
            body += '<InstanceID>0</InstanceID>';
            body += '</u:'+the_action+'>';
            
            var the_message = soap_envelope(body);
            
            call_sonos_upnp (the_object, the_ip, the_message, the_type, the_action, the_path);
        }

        function call_sonos_s2_next (the_object, the_ip) {
            var the_type = 'urn:schemas-upnp-org:service:AVTransport:1';
            var the_path = '/MediaRenderer/AVTransport/Control';
            var the_action = 'Next';
            
            var body = '<u:'+the_action+' xmlns:u="'+the_type+'">';
            body += '<InstanceID>0</InstanceID>';
            body += '</u:'+the_action+'>';
            
            var the_message = soap_envelope(body);
            
            call_sonos_upnp (the_object, the_ip, the_message, the_type, the_action, the_path);
        }

        function call_sonos_s2_previous (the_object, the_ip) {
            var the_type = 'urn:schemas-upnp-org:service:AVTransport:1';
            var the_path = '/MediaRenderer/AVTransport/Control';
            var the_action = 'Previous';
            
            var body = '<u:'+the_action+' xmlns:u="'+the_type+'">';
            body += '<InstanceID>0</InstanceID>';
            body += '</u:'+the_action+'>';
            
            var the_message = soap_envelope(body);
            
            call_sonos_upnp (the_object, the_ip, the_message, the_type, the_action, the_path);
        }

        const { entity, update } = data;

        // Remotes
        if (Object.keys(this.sonos_ip_for_control).includes(entity.ID) ) {
            var the_ip = this.sonos_ip_for_control[entity.ID];
            //this.logger.info("received command:"+update.action);
            if (entity.zh._modelID == 'SYMFONISK Sound Controller') { //IKEA Gen 1
                if (update.action === 'toggle') {
                    call_sonos_toggle (this, the_ip); 
                }
                if (update.action === 'brightness_move_up') {
                    call_sonos_s2_relative_volume (this, the_ip, '+'+this.sonos_volume_step[entity.ID]);
                }
                if (update.action === 'brightness_move_down') {
                    call_sonos_s2_relative_volume (this, the_ip, '-'+this.sonos_volume_step[entity.ID]);
                }
                if (update.action === 'brightness_step_up') {
                    call_sonos_s2_next (this, the_ip);
                }
                if (update.action === 'brightness_step_down') {
                    call_sonos_s2_previous (this, the_ip);
                }
            }
            if (entity.zh._modelID == 'SYMFONISK sound remote gen2') { //IKEA Gen 2
                if ((update.action === 'toggle') || (update.action === 'play_pause'))  {
                    call_sonos_toggle (this, the_ip); 
                }
                if ((update.action === 'volume_up') || (update.action === 'volume_up_hold')) {
                    call_sonos_s2_relative_volume (this, the_ip, '+'+this.sonos_volume_step[entity.ID]);
                }
                if ((update.action === 'volume_down') || (update.action === 'volume_down_hold')) {
                    call_sonos_s2_relative_volume (this, the_ip, '-'+this.sonos_volume_step[entity.ID]);
                }
                if (update.action === 'track_next') {
                    call_sonos_s2_next (this, the_ip);
                }
                if (update.action === 'track_previous') {
                    call_sonos_s2_previous (this, the_ip);
                }
                //tbd, these get fired when the dot buttons are pressed
                if (update.action === 'dots_1_short_release') {
    
                }
                if (update.action === 'dots_1_long_press') {
    
                }
                if (update.action === 'dots_2_short_release') {
    
                }
                if (update.action === 'dots_2_long_press') {
    
                }
            }
        }
    }

    async onMQTTMessage(topic, message) {
        // console.log({topic, message});
    }

    async stop() {
        this.eventBus.removeListeners(this.constructor.name);
    }
}

module.exports = my_sonos_control;
