class my_lms_control {
    constructor(zigbee, mqtt, state, publishEntityState, eventBus, settings, logger) {
        logger.info('Loaded lms_control');
        mqtt.publish('extension/info', 'hello from lms_control');
        this.mqttBaseTopic = settings.get().mqtt.base_topic;
        this.eventBus = eventBus;
        this.mqtt = mqtt;
        this.eventBus.on('stateChange', this.onStateChange.bind(this), this.constructor.name);
        
        //logger
        this.logger = logger;
        
        //local values for Sonos
        this.lms_mac_for_control = {};
        this.lms_volume_step = {};
        this.lms_fav_dot_1_short_no = {};
        this.lms_fav_dot_1_long_no = {};
        this.lms_fav_dot_2_short_no = {};
        this.lms_fav_dot_3_long_no = {};

        //-----------------------------------
        //Configure here
        //-----------------------------------
        // example
        //LMS Server
        this.lms_host = "192.168.x.y";
        this.lms_port= "9000";
        this.lms_user="username";
        this.lms_password="password";
        
        //LMS Player
        this.lms_mac_for_control["0x1234567890abcdef"] = "aa:bb:cc:dd:ee:ff";
        this.lms_volume_step["0x1234567890abcdef"] = "2";
        this.lms_fav_dot_1_short_no["0x1234567890abcdef"] = "1";
        this.lms_fav_dot_1_long_no["0x1234567890abcdef"] = "2";
        this.lms_fav_dot_2_short_no["0x1234567890abcdef"] = "3";
        this.lms_fav_dot_3_long_no["0x1234567890abcdef"] = "4";
        //-----------------------------------
        //End of configuration
        //-----------------------------------
    }

    async onStateChange(data) {
        
        //lms functions
        function call_lms_json_rpc (the_object, the_message) {
            var http = require('http');  

            // An object of options to indicate where to post to
            var post_options = {
                host: the_object.lms_host,
                port: the_object.lms_port,
                path: '/jsonrpc.js',
                method: 'POST',
                auth: the_object.lms_user + ':' + the_object.lms_password,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': the_message.length
                }
            };
            
            // Set up the request
            var post_req = http.request(post_options, function(res) {
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    //console.log('Response: ' + chunk);
                    //the_object.logger.info("hier3"+chunk);
                });
            });
            
            // post the data
            post_req.write(the_message);
            post_req.end();

        }

        function lms_toggle (the_object, the_mac) {
            var the_message = JSON.stringify({'method': 'slim.request', 'params': [the_mac, ["pause"]]});
            call_lms_json_rpc (the_object, the_message);
        }
        function lms_volume_up (the_object, the_mac, the_step) {
            var the_message = JSON.stringify({'method': 'slim.request', 'params': [the_mac, ["mixer","volume","+"+the_step]]});
            call_lms_json_rpc (the_object, the_message);
        }
        function lms_volume_down (the_object, the_mac, the_step) {
            var the_message = JSON.stringify({'method': 'slim.request', 'params': [the_mac, ["mixer","volume","-"+the_step]]});
            call_lms_json_rpc (the_object, the_message);
        }
        function lms_next (the_object, the_mac) {
            var the_message = JSON.stringify({'method': 'slim.request', 'params': [the_mac, ["playlist","index","+1"]]});
            call_lms_json_rpc (the_object, the_message);
        }
        function lms_previous (the_object, the_mac) {
            var the_message = JSON.stringify({'method': 'slim.request', 'params': [the_mac, ["playlist","index","-1"]]});
            call_lms_json_rpc (the_object, the_message);
        }
        function lms_play_fav (the_object, the_mac, the_id) {
            var the_message = JSON.stringify({'method': 'slim.request', 'params': [the_mac, ["favorites","playlist","play","item_id:"+the_id]]});
            call_lms_json_rpc (the_object, the_message);
        }

        const { entity, update } = data;

        // Remotes
        if (Object.keys(this.lms_mac_for_control).includes(entity.ID) ) {
            var the_mac = this.lms_mac_for_control[entity.ID];
            var the_step = this.lms_volume_step[entity.ID];
            if (entity.zh._modelID == 'SYMFONISK Sound Controller') { //IKEA Gen 1
                if (update.action === 'toggle') {
                    lms_toggle (this, the_mac);
                }
                if (update.action === 'brightness_move_up') {
                    lms_volume_up (this, the_mac, the_step);
                }
                if (update.action === 'brightness_move_down') {
                    lms_volume_down (this, the_mac, the_step);
                }
                if (update.action === 'brightness_step_up') {
                    lms_next (this, the_mac);
                }
                if (update.action === 'brightness_step_down') {
                    lms_previous (this, the_mac);
                }
            }
            if (entity.zh._modelID == 'SYMFONISK sound remote gen2') { //IKEA Gen 2
                if ((update.action === 'toggle') || (update.action === 'play_pause'))  {
                    lms_toggle (this, the_mac);
                }
                if ((update.action === 'volume_up') || (update.action === 'volume_up_hold')) {
                    lms_volume_up (this, the_mac, the_step);
                }
                if ((update.action === 'volume_down') || (update.action === 'volume_down_hold')) {
                    lms_volume_down (this, the_mac, the_step);
                }
                if (update.action === 'track_next') {
                    lms_next (this, the_mac);
                }
                if (update.action === 'track_previous') {
                    lms_previous (this, the_mac);
                }
                if (update.action === 'dots_1_short_release') {
                    lms_play_fav (the_object, the_mac, lms_fav_dot_1_short_no[entity.ID]);
                }
                if (update.action === 'dots_1_long_press') {
                    lms_play_fav (the_object, the_mac, lms_fav_dot_1_long_no[entity.ID]);
                }
                if (update.action === 'dots_2_short_release') {
                    lms_play_fav (the_object, the_mac, lms_fav_dot_2_short_no[entity.ID]);
                }
                if (update.action === 'dots_2_long_press') {
                    lms_play_fav (the_object, the_mac, lms_fav_dot_2_long_no[entity.ID]);
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

module.exports = my_lms_control;
