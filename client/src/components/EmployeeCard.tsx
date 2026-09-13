import { PencilIcon, Trash2Icon } from "lucide-react"
import api from "../api/axios";
import toast from "react-hot-toast";

const EmployeeCard = ({ employee, onDelete, onEdit }) => {

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this employee?"))
      return;
    try {
      await api.delete(`/employees/${employee.id}`)
      onDelete()
      toast.success("Employee deleted successfully")
    } catch (err) {
      toast.error("Failed to delete employee")
    }
  }

  return (
    <div className={`group relative card card-hover overflow-hidden transition-all duration-200 ${
      employee.isDeleted ? "opacity-65 grayscale bg-slate-100/80 border-slate-300 select-none" : ""
    }`}>
      <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-50">
        {/* Circle Icons */}
        <div className="w-full h-full flex items-center justify-center p-4">
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-indigo-100 to-slate-100 flex items-center justify-center">
            <span className="text-2xl font-medium text-indigo-400">
              {employee.firstName ? employee.firstName[0] : ""} {employee.lastName ? employee.lastName[0].toLowerCase() : ""}
            </span>
          </div>
        </div>
      </div>
      <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap z-10">
        <span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-slate-600 rounded-lg shadow-sm">
          {employee.department || "Remote"}
        </span>
        {employee.isDeleted && (
          <span className="bg-red-600 text-white px-2 py-0.5 text-xs font-bold rounded-md shadow-xs uppercase tracking-wider">
            DELETED
          </span>
        )}
      </div>
      {!employee.isDeleted && (
        <div className="absolute inset-0 bg-linear-to-t from-indigo-700/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end pr-5 pb-5 gap-3">
          <button onClick={() => onEdit(employee)} className="p-2.5 bg-white/90 backdrop-blur-sm text-slate-700 hover:text-indigo-600 rounded-xl shadow-lg transition-all hover:scale-105">
            <PencilIcon className="w-4 h-4" />
          </button>
          <button onClick={handleDelete} className="p-2.5 bg-white/90 backdrop-blur-sm text-slate-700 hover:text-rose-600 rounded-xl shadow-lg transition-all hover:scale-105">
            <Trash2Icon className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="p-5">
        <h3 className="text-slate-900 font-semibold">{employee.firstName} {employee.lastName}</h3>
        <p className="text-xs text-slate-500">{employee.position}</p>
      </div>
    </div>
  )
}

export default EmployeeCard