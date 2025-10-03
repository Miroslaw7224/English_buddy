// @ts-nocheck
// eslint-disable

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useNavigation = () => {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState('chat');

  useEffect(() => {
    const path = location.pathname;
    if (path === '/') {
      setCurrentPage('chat');
    } else if (path === '/words') {
      setCurrentPage('words');
    }
  }, [location]);

  const navigateTo = (page: string) => {
    setCurrentPage(page);
  };

  const isActivePage = (page: string) => {
    return currentPage === page;
  };

  return { 
    currentPage, 
    navigateTo, 
    isActivePage,
    location 
  };
};