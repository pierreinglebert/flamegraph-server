A server that list your profiler logs and creates flamegraph for analysis.

# Install

```docker run -d -v logs:/src/logs pierreinglebert/flamegraph-server```

# Environment variables

  * ```LOG_DIR```: the folder in which the application will look for profiler logs (defaults to ./logs)
  * ```PORT```: the listening port (defaults to 80)

# Example

## docker-compose.yml

```
version: '2'
services:
  profiled-application:
    build:
      context: ./app
    volumes:
      - ./logs:/src/logs
    command: node --prof --logfile=logs/game.log index.js
  flamegraph:
    ports:
      - "80:80"
    volumes:
      - ./logs:/src/logs
```