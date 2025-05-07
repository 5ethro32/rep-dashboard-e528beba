
import React from 'react';

interface PageHeadingProps {
  selectedUserId: string | null;
  selectedUserName: string;
}

const PageHeading = ({ selectedUserId, selectedUserName }: PageHeadingProps) => {
  // Helper function to generate heading with gradient username
  const renderHeading = () => {
    if (selectedUserId === "all") {
      return (
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-finance-red to-rose-700">
            All
          </span>{' '}
          Account Performance
        </h1>
      );
    } else {
      // If it's "My Data", just use "My", otherwise use the name with apostrophe
      const nameToShow = selectedUserName === 'My Data' ? 'My' : `${selectedUserName}'s`;
      
      return (
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-finance-red to-rose-700">
            {nameToShow}
          </span>{' '}
          Account Performance
        </h1>
      );
    }
  };

  return (
    <div className="mb-8">
      {renderHeading()}
      <p className="text-white/60">
        {selectedUserId === "all"
          ? "Compare all accounts performance between months to identify declining or improving accounts."
          : selectedUserName && selectedUserName !== 'My Data' 
            ? `Compare ${selectedUserName}'s accounts performance between months to identify declining or improving accounts.`
            : "Compare your accounts performance between months to identify declining or improving accounts."}
      </p>
    </div>
  );
};

export default PageHeading;
