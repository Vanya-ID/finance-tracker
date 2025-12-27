import React, { useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import { ChartDataPoint, ComparisonDataPoint, COLORS } from '../utils/chartData'
import './PlanVsActualChart.css'

interface PlanVsActualChartProps {
  planData?: ChartDataPoint[]
  actualData?: ChartDataPoint[]
  comparisonData?: ComparisonDataPoint[]
  type: 'pie' | 'bar' | 'line'
  title?: string
}

export const PlanVsActualChart: React.FC<PlanVsActualChartProps> = ({
  planData,
  actualData,
  comparisonData,
  type,
  title,
}) => {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  const toggleCategory = (categoryName: string) => {
    setCollapsedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName)
      } else {
        newSet.add(categoryName)
      }
      return newSet
    })
  }

  const renderPieChart = () => {
    if (!planData) return null

    const planChartData = planData.map((d) => ({ name: d.name, value: d.value }))
    const actualChartData = actualData?.map((d) => ({ name: d.name, value: d.value }))

    return (
      <div className="chart-container">
        {title && <h3 className="chart-title">{title}</h3>}
        <div className="charts-row">
          <div className="chart-wrapper">
            <h4>План</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={planChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => percent !== undefined ? `${name}: ${(percent * 100).toFixed(1)}%` : name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {planChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number | undefined) => value !== undefined ? `${value.toLocaleString('ru-RU')} Br` : ''} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {actualChartData && (
            <div className="chart-wrapper">
              <h4>Факт</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={actualChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => percent !== undefined ? `${name}: ${(percent * 100).toFixed(1)}%` : name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {actualChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number | undefined) => value !== undefined ? `${value.toLocaleString('ru-RU')} Br` : ''} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderBarChart = () => {
    if (!comparisonData) return null

    const visibleData = comparisonData.filter((item) => !collapsedCategories.has(item.name))

    const data = visibleData.map((item) => ({
      name: item.name,
      План: item.plan,
      Факт: item.actual,
      Отклонение: item.deviation ? `${item.deviation > 0 ? '+' : ''}${item.deviation.toFixed(1)}%` : '-',
    }))

    return (
      <div className="chart-container">
        {title && <h3 className="chart-title">{title}</h3>}
        <div className="category-filters">
          {comparisonData.map((item) => (
            <button
              key={item.name}
              className={`category-filter-btn ${collapsedCategories.has(item.name) ? 'collapsed' : 'active'}`}
              onClick={() => toggleCategory(item.name)}
              title={collapsedCategories.has(item.name) ? 'Показать категорию' : 'Скрыть категорию'}
            >
              {collapsedCategories.has(item.name) ? '👁️‍🗨️' : '👁️'} {item.name}
            </button>
          ))}
        </div>
        {visibleData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number | undefined) => value !== undefined ? `${value.toLocaleString('ru-RU')} Br` : ''} />
              <Legend />
              <Bar dataKey="План" fill={COLORS.plan} />
              <Bar dataKey="Факт" fill={COLORS.actual} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty-state">
            <p>Все категории скрыты. Раскройте категории, чтобы увидеть график.</p>
          </div>
        )}
      </div>
    )
  }

  const renderLineChart = () => {
    if (!comparisonData) return null

    const data = comparisonData.map((item) => ({
      name: item.name,
      План: item.plan,
      Факт: item.actual,
    }))

    return (
      <div className="chart-container">
        {title && <h3 className="chart-title">{title}</h3>}
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value: number | undefined) => value !== undefined ? `${value.toLocaleString('ru-RU')} Br` : ''} />
            <Legend />
            <Line type="monotone" dataKey="План" stroke={COLORS.plan} strokeWidth={2} />
            <Line type="monotone" dataKey="Факт" stroke={COLORS.actual} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  switch (type) {
    case 'pie':
      return renderPieChart()
    case 'bar':
      return renderBarChart()
    case 'line':
      return renderLineChart()
    default:
      return null
  }
}

