'use client';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import React from 'react'
const queryClient = new QueryClient()
export function ReactQueryProvider ({children} : React.PropsWithChildren) {
    return(
        <QueryClientProvider client={queryClient}>
            { children }
        </QueryClientProvider>
    )
}