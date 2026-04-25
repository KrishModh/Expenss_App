const MetricCard = ({ label, value, tone }) => (
  <article className={`metric-card ${tone || ""}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </article>
);

export default MetricCard;
