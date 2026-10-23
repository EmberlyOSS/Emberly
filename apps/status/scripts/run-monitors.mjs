const port = process.env.PORT || 3000;
const url = `http://localhost:${port}/api/cron/run-monitors`;
const secret = process.env.CRON_SECRET;

const res = await fetch(url, {
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
});
const body = await res.text();

console.log(res.status, body);

if (!res.ok) {
    process.exit(1);
}
