import React from "react";

const GradientBackground = ({ children }) => (
  <div className="relative min-h-screen bg-background-dark overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    {/* Top right: Pink/Purple */}
    <div className="absolute top-[-25%] right-[-10%] w-[60vw] h-[30vw] bg-gradient-1 opacity-90  blur-md pointer-events-none" />
    {/* Bottom left: Blue/Green */}
    <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-gradient-4 opacity-60 rounded-full blur-3xl pointer-events-none" />
    {/* Center left: Blue */}
    <div className="absolute bottom-[10%] left-[-20%] w-[50vw] h-[50vw] bg-gradient-3 opacity-40 rounded-full blur-3xl pointer-events-none" />
   
   
    {/* Top left: Deep Blue/Green */}
    {/* <div className="absolute top-[15%] left-[-10%] w-[40vw] h-[40vw] bg-gradient-2 opacity-40 rounded-full blur-3xl pointer-events-none" /> */}
    {/* Content */}
    <div className="relative z-10 w-full">{children}</div>
  </div>
);

export default GradientBackground; 