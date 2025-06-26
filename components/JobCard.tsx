import React from 'react';

type JobCardProps = {
  title: string;
  company: string;
  location: string;
  postedDate?: string;
};

const JobCard: React.FC<JobCardProps> = ({
  title,
  company,
  location,
  postedDate = 'Posted after yesterdays tomorrow',
}) => {
  return (
    <div className="border p-4 rounded-xl shadow hover:shadow-lg transition bg-white dark:bg-gray-800">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-gray-600 dark:text-gray-300">{company}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{location}</p>
      <span className="text-xs text-blue-500 dark:text-blue-400">{postedDate}</span>
    </div>
  );
};

export default JobCard;
