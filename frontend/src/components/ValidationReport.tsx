type Report = {
  missing_values: number;
  negative_values: number;
  rows: number;
  reliability_score: number;
  anomaly_count: number;
  errors: number;
  warnings: number;
};

type Props = { report: Report; output: string };

export default function ValidationReport({ report, output }: Props) {
  const scoreColor =
    report.reliability_score >= 90 ? "text-green-600"
    : report.reliability_score >= 70 ? "text-yellow-600"
    : "text-red-600";

  const scoreBar =
    report.reliability_score >= 90 ? "bg-green-500"
    : report.reliability_score >= 70 ? "bg-yellow-500"
    : "bg-red-500";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-gray-900">Rapport de validation</h2>
        <a
          href={`/download/${output}`}
          className="inline-flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
          style={{ background: "#7d1c34" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Télécharger {output}
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <Stat label="Lignes traitées" value={report.rows} />
        <Stat label="Erreurs" value={report.errors} warn={report.errors > 0} />
        <Stat label="Avertissements" value={report.warnings} warn={report.warnings > 0} />
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Score de fiabilité</p>
          <p className={`text-2xl font-bold ${scoreColor}`}>{report.reliability_score}%</p>
        </div>
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${scoreBar}`}
          style={{
            width: `${report.reliability_score}%`,
            transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${warn ? "text-red-600" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}
