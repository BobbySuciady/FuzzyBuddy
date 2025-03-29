const Sidebar = ({ isAuthenticated }) => {
    const authenticateUser = () => {
        window.location.href = 'http://localhost:5000/api/calendar/auth';
    };

    return (
        <div 
            className="h-full w-[216px] rounded-r-xl flex flex-col items-center justify-center text-white"
            style={{ backgroundColor: '#A43FE7' }}
        >
            {!isAuthenticated && (
                <button onClick={authenticateUser} className="p-2 bg-yellow-500 text-black rounded">
                    Link Your Google Calendar
                </button>
            )}
            <p className="mt-4">Sidebar Content</p>
        </div>
    );
};

export default Sidebar;