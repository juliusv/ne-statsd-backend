# Preaggregating StatsD backend for StatsD

## Overview
This StatsD backend preaggregates metrics and sends them to another StatsD.

## Configuration
In your StatsD configuration, add the following settings:
```
{
  backends: [ "statsd-backend" ],
  statsdBackend: {
    host: "localhost",
    port: 8125
  }
}
```
