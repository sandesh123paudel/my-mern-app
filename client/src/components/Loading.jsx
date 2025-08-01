const Loading = ({ message = "Loading...", size = "large" }) => {
  const sizeClasses = {
    small: "h-6 w-6",
    medium: "h-8 w-8",
    large: "h-12 w-12",
    xl: "h-16 w-16",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div
          className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-primary-green mx-auto mb-4`}
        >
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary-brown animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          ></div>
        </div>
        <p className="text-primary-brown font-medium">{message}</p>
      </div>
    </div>
  );
};

// Small inline loading spinner
export const InlineLoading = ({ message = "Loading...", size = "small" }) => {
  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-6 w-6",
    large: "h-8 w-8",
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-primary-green mr-2`}
      ></div>
      <span className="text-primary-brown text-sm">{message}</span>
    </div>
  );
};

export default Loading;
