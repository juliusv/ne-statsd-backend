# Network-efficient Preaggregating StatsD backend for StatsD

## Overview
This StatsD backend preaggregates metrics and sends them to another StatsD. It
tries to fit as many metric changes as possible into the MTU and also combines
multiple changes for the same metric into a single line.

This backend is useful e.g. for decreasing the load on a central statsd by
preaggregating - and thereby shrinking - stats on a first layer of statsds
before sending them on to the central one. The first layer of statsds can even
be run locally with the process that is producing stats, so no network traffic
is generated on this layer.

To prevent losing accuracy due to preaggregation, the flush period of the first
layer of statsds should be significantly smaller than that of the main statsd:
for example, 500ms for the first layer and 10s for the second, depending on how
many first-layer statsds write into the main one.

## Aggregation
### Gauges
Only the last received value for a given gauge within the flush period is
passed on:

```
foo:7|g
foo:10|g
```

becomes:

```
foo:10|g
```

### Counters
Counters for the same metric are summed up before flushing them out to the
backend statsd:

```
foo:3|c
foo:2|c
foo:1|c
foo:6|c
```

becomes:

```
foo:12|c
```

### Timers
Timer values are passed on verbatim, but sent in a more network
efficient-format by sending multiple on the same line:

```
foo:8|ms
foo:5|ms
foo:3|ms
```

becomes:

```
foo:8|ms:5|ms:3|ms
```

### Sets
Sets are currently not supported, but are trivial to add. However, old versions
of statsd didn't support sets, so care needs to be taken to remain
backwards-compatible.

### Combination of different metric types into one line
If different types of metric changes are received for the same metric name,
they still get aggregated into the same line:

```
foo:1|c
foo:3|c
foo:5|ms
foo:3|ms
foo:6|g
foo:7|g
```

becomes:

```
foo:4|c:5|ms:3|ms:7|g
```

### Fitting metrics into the MTU
ne-statsd-backend tries to fit as many stats for the same metric into the same
line, unless that line would result in a UDP packet larger than the configured
MTU. In that case, the changes are split into MTU-compatible lines. In the case
of multiple short lines, ne-statsd-backend also fits as many lines as possible
into the same datagram.

## Configuration
In your StatsD configuration, add the following settings:
```
{
  backends: [ "ne-statsd-backend" ],
  statsdBackend: {
    host: "localhost",
    port: 8125,
    mtu: 1500 // optional, default: 1500
  }
}
```

## Contributing
Pull requests welcome!
