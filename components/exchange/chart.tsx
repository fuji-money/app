import { AreaChart, Area, YAxis, Tooltip } from 'recharts'

const Chart = ({ days = 7 }) => {
  const data = []
  for (let i = 0; i < days; i += 1) {
    data.push({ price: Math.floor(Math.random() * 1000) })
  }
  return (
    <AreaChart
      width={600}
      height={300}
      data={data}
      margin={{
        top: 10,
        right: 30,
        left: 0,
        bottom: 0,
      }}
    >
      <defs>
        <linearGradient id="purple" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#80288E" stopOpacity={0.8} />
          <stop offset="95%" stopColor="#80288E" stopOpacity={0} />
        </linearGradient>
      </defs>
      <YAxis />
      <Tooltip />
      <Area
        type="monotone"
        dataKey="price"
        stroke="#80288E"
        fillOpacity={1}
        fill="url(#purple)"
      />
    </AreaChart>
  )
}

export default Chart
