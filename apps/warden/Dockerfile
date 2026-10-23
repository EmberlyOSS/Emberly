FROM golang:1.25-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY *.go malicious_domains.txt ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /emberly-mod-bot .

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /emberly-mod-bot /emberly-mod-bot
ENTRYPOINT ["/emberly-mod-bot"]
