Manual cleanup

docker rm -f e2e-test-postgres;
docker image rm postgres:15;
docker volume prune -f;

Manual start:
docker run --rm -e POSTGRES_PASSWORD=test -p 5433:5432 postgres:15