FROM swift:5.10-jammy AS build
WORKDIR /build
COPY . .
RUN swift build -c release

FROM ubuntu:22.04
RUN apt-get update && apt-get install -y ca-certificates git openssh-server && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /build/.build/release/App /usr/local/bin/gitke
COPY Resources ./Resources
COPY Public ./Public
EXPOSE 2018
ENV PORT=2018 HOST=0.0.0.0 REPO_ROOT=/data/git/repositories
CMD ["/usr/local/bin/gitke", "serve", "--env", "production", "--hostname", "0.0.0.0", "--port", "2018"]
