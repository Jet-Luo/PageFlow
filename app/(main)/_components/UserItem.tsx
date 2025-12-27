'use client'

import { SignOutButton, useUser } from '@clerk/nextjs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { ChevronsLeftRight } from 'lucide-react'

const UserItem = () => {
  const { user } = useUser()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          role="button"
          className="hover:bg-primary/5 flex w-full cursor-pointer items-center p-3 text-sm"
        >
          <div className="flex max-w-[150px] items-center gap-x-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={user?.imageUrl} alt={user?.fullName || 'User Avatar'} />
            </Avatar>
            <span className="line-clamp-1 text-start font-medium">
              {user ? `${user.fullName || user.username || 'User'}'s PageFlow` : 'Your PageFlow'}
            </span>
          </div>
          <ChevronsLeftRight className="text-muted-foreground ml-2 h-4 w-4 rotate-90" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="start" alignOffset={11} forceMount>
        <div className="flex flex-col space-y-4 p-2">
          <p className="text-muted-foreground text-xs leading-none font-medium">
            {user ? `Logged in as ${user.emailAddresses[0]?.emailAddress}` : 'Not logged in'}
          </p>
          <div className="flex items-center gap-x-2">
            <div className="bg-secondary rounded-md p-1">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName || 'User Avatar'} />
              </Avatar>
            </div>
            {/*<div className="space-y-1">*/}
            {/*  <p className="line-clamp-1 text-sm">*/}
            {/*    {user ? `${user?.fullName}'s PageFlow` : 'Your PageFlow'}*/}
            {/*  </p>*/}
            {/*</div>*/}
            <div className="flex flex-col">
              <span className="font-medium">
                {user ? user.fullName || user.username || 'User' : 'Your PageFlow'}
              </span>
              <span className="text-muted-foreground text-sm">
                {user
                  ? user.emailAddresses[0]?.emailAddress
                  : 'Please log in to access more features.'}
              </span>
            </div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-muted-foreground w-full cursor-pointer" asChild>
          <SignOutButton>Sign Out</SignOutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserItem
