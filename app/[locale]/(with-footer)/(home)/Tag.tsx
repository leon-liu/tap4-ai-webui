'use client';

import { useState } from 'react';
import Link from 'next/link';

export function TagItem({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex h-[38px] items-center justify-center gap-[2px] whitespace-nowrap rounded-full bg-[#2C2D36] bg-gray-100 px-3 text-xs text-gray-800 transition-colors duration-200 dark:bg-[#2C2D36] dark:text-white'>
      {children}
    </div>
  );
}

export function TagLink({ name, href }: { name: string; href: string }) {
  return (
    <Link href={href} title={name} className='transition-opacity duration-200 hover:opacity-80'>
      <TagItem>{name}</TagItem>
    </Link>
  );
}

export function TagList({ data }: { data: { name: string; href: string; id: string }[] }) {
  const [showAll, setShowAll] = useState(false);
  const itemsToShow = showAll ? data.length : Math.ceil(data.length / 3);
  const visibleData = data.slice(0, itemsToShow);

  return (
    <div className='flex flex-col gap-3'>
      <ul className='no-scrollbar flex max-w-full flex-1 flex-wrap items-center gap-3 overflow-auto lg:flex-col'>
        {visibleData.map((item) => (
          <li key={item.href}>
            <TagLink name={item.name} href={item.href} />
          </li>
        ))}
      </ul>
      {data.length > 1 && (
        <button
          type='button'
          onClick={() => setShowAll(!showAll)}
          className='text-sm text-gray-600 underline underline-offset-2 transition-colors duration-200 hover:text-gray-900 dark:text-white/80 dark:hover:text-white'
        >
          {showAll ? 'Show Less Tags' : 'Show More Tags'}
        </button>
      )}
    </div>
  );
}
