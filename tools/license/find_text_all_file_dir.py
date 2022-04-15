import os

user_input = input('What is the name of your directory: ')
user_input =  user_input.replace(" ", "").lower()

rootdir = str(user_input)


searchstring = input('What word are you trying to find?: ')

for subdir, dirs, files in os.walk(rootdir):
    for file in files:
        file_location = os.path.join(subdir, file)
        if os.path.isfile(file_location):
            f = open(file_location)

            try:
                if searchstring in f.read().replace(" ", "").lower():
                    # YYYMMM dont need to print, use pass to pass the if
                    #print('found string in file %s' % file_location)
                    pass
                else:
                    #print('string not found in file %s' % file_location)
                    print(file_location)
                f.close()
            except Exception:
                pass
