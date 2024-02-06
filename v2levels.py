levels = [
"""
MMMMMMMMMMMMMM
  M  MMM     M
  M  M M  MMMM
             M
MMMM  MMM MMMM
M  M  M      M
MMMMMMM MMMMMM
M M M M M M MM
MMMM         W
MMMMMMMMMMMMMM
""",
"""
MMMMMMMMMMMMMM
   M M M M M M
        M M  M
    M M M M MM
MMM          M
MMM     M    M
MMMMMMMMM M MM
MM M M MMM   M
MMMMMMMMMM W M
""",
"""
MMMMMMMMMMMMMM
     MMMMMMMMM
           MMM
MMMM         M
M     MM M   M
MMMMMM   MMMMM
M            M
MMMM MMMMMMMMM
M WWWWW  MMMMM
"""
]

LINELENGTH = 15
LEVEL = 0

def assignpos(s, pos, ch):
    # just blindly copy and paste this function for now
    # later we will explain it
    # basically this allows us to assign a character to a position in a string
    # string: "abcde"
    # assignpos allows us to change "abcde" into "ab1de" or something like that
    l = list(s); l[pos] = ch; return "".join(l)

while LEVEL < len(levels):

    playerpos = LINELENGTH+1
    print("level %d" % LEVEL)

    maze = levels[LEVEL]

    while maze[playerpos] != "W":
        maze = assignpos(maze, playerpos, "X")
        print(maze)
        instruction = input()
        newpos = 0
        if instruction == "S":
            newpos = playerpos + LINELENGTH

        if instruction == "W":
            newpos = playerpos - LINELENGTH

        if instruction == "A":
            newpos = playerpos - 1

        if instruction == "D":
            newpos = playerpos + 1
        
        if maze[newpos] == "M":
            print("you lose!")
            break
        else:
            maze = assignpos(maze, playerpos, " ")
            playerpos = newpos
        
    if maze[playerpos] == "W":
        print("you have passed level %d" % LEVEL)
        LEVEL += 1

print("congratulations! you have completed the maze.")