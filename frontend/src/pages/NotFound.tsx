import { Link } from "react-router-dom"

const NotFound = () => {
    return (<>
        <div className="text-center py-20 bg-white rounded-[3rem] shadow-xl max-w-2xl mx-auto mt-10 border border-slate-100">
            <h1 className="text-9xl font-black text-slate-200">404</h1>
            <h2 className="text-2xl font-bold text-slate-800 mt-4 uppercase tracking-tighter">
                Page Not Found
            </h2>
            <p className="text-slate-500 mt-2 mb-8">
                Sorry, the page you are looking for doesn't exist or has been moved.
            </p>
            <Link to="/" className="px-8 py-3 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all">
                Go Back
            </Link>
        </div>
    </>
    )
}

export default NotFound