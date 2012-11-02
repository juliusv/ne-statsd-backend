var dgram = require('dgram'),
    util = require('util');

function StatsdBackend(startupTime, config, events) {
  var self = this;
  this.config = config.statsdBackend;
  this.max_payload_length = (this.config.mtu || 1500) - 8; // 8 = UDP header length.
  this.socket = dgram.createSocket('udp4');
  this.metric_lines = {};
  events.on('flush', function(time_stamp, metrics) { self.flush(time_stamp, metrics); });
}

StatsdBackend.prototype.flush = function(time_stamp, metrics) {
  var self = this;

  for (var key in metrics.gauges) {
    var g = metrics.gauges[key];
    self.addMetricValue(key, g + '|g');
  }

  for (var key in metrics.timers) {
    var t = metrics.timers[key];
    t.forEach(function(v) {
      self.addMetricValue(key, v + '|ms');
    });
  }

  for (var key in metrics.counters) {
    var c = metrics.counters[key];
    if(c != 0) {
      self.addMetricValue(key, c + '|c');
    }
  }

  self.sendMetrics();
  self.metric_lines = {};
}

StatsdBackend.prototype.addMetricValue = function(key, value) {
  var self = this;
  value = ':' + value;

  // Do we already have an array of metrics lines for this key? Otherwise,
  // create one.
  if (!(key in self.metric_lines)) {
    self.metric_lines[key] = [];
  }

  self.addToStringListSplitByMTU(self.metric_lines[key], value, key);
};

StatsdBackend.prototype.addToStringListSplitByMTU = function(list, value, initial_value) {
  var self = this;
  if (list.length == 0) {
    list.push(initial_value);
  }
  var last_index = list.length - 1;

  // If the value by itself is already bigger than the maximum length, try to
  // fit it into a new string by itself anyways.
  // If the current string would grow beyond the maximum length due to the
  // newly appended value, also put the value into a new string.
  if ((value.length > self.max_payload_length) ||
      (list[last_index].length + value.length > self.max_payload_length)) {
    if (list[last_index].length) {
      list.push(initial_value);
      last_index++;
    }
  }
  list[last_index] += value;
};

StatsdBackend.prototype.sendMetrics = function() {
  var self = this;
  var dgrams = [];
  // Split metric_lines into UDP datagrams, each smaller than the MTU.
  for (var key in self.metric_lines) {
    var metric_lines = self.metric_lines[key];
    for (var i in metric_lines) {
      // TODO(julius): Fix edge-case where the line fits exactly into the MTU
      // (and with newline it doesn't fit anymore). Right now the datagram
      // would simply be 1 byte too big and could get lost.
      var dgram_part = metric_lines[i] + '\n';
      self.addToStringListSplitByMTU(dgrams, dgram_part, '');
    }
  }

  for (var i in dgrams) {
    var dgram = dgrams[i];
    var data = new Buffer(dgram);
    self.socket.send(data, 0, data.length, self.config.port, self.config.host, function(error, bytes) {
      console.log('Sent ' + bytes + ' bytes to ' + self.config.host + ':' + self.config.port);
      if (error) {
        console.log('Error while sending to remote statsd: ' + error);
      }
    });
  }
};

exports.init = function(startupTime, config, events) {
  var instance = new StatsdBackend(startupTime, config, events);
  return true;
};
