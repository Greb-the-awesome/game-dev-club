maze = """
MMMMMMMMMMMMMM
  M  MMM    M
  M  M M  MMMM
             M
MMMM  MMM MMMM
M  M  M      M
MMMMMMM MMMMMM
M M M M M M MM
MMMM         W
MMMMMMMMMMMMMM
"""
LINELENGTH = 15

def assignpos(s, pos, ch):
    # just blindly copy and paste this function for now
    # later we will explain it
    # basically this allows us to assign a character to a position in a string
    # string: "abcde"
    # assignpos allows us to change "abcde" into "ab1de" or something like that
    l = list(s); l[pos] = ch; return "".join(l)

playerpos = LINELENGTH+1

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
    
if maze[playerpos] == "W": print("you win!")