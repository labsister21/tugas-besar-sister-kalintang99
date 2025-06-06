docker network create --driver bridge --subnet 172.25.0.0/16 raftnet

docker network rm raftnet

docker-compose -f docker-compose-node5.yml up -d

docker-compose -f docker-compose-node1.yml up -d

tc qdisc add dev eth0 root netem delay 100ms 50ms reorder 8% corrupt 5% duplicate 2% loss 5%

tc qdisc add dev eth0 root netem delay 100ms 50ms reorder 8% corrupt 5% duplicate 2% 5% loss 5%
