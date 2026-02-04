// app/(dashboard)/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading dashboard...</p>
        <p className="text-sm text-slate-400 mt-2">Please wait, this may take a moment</p>
      </div>
    </div>
  )
}