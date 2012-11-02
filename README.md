# Preaggregating StatsD backend for StatsD

## Overview
This StatsD backend preaggregates metrics and sends them to another StatsD. It
tries to fit as many metric changes as possible into the MTU.

## Configuration
In your StatsD configuration, add the following settings:
```
{
  backends: [ "ne-statsd-backend" ],
  statsdBackend: {
    host: "localhost",
    port: 8125,
    mtu: 1500 // default: 1500
  }
}
```
