import random
import json
import os, shutil

from gurobi.AssetTypes import *

# returns a list populated with the the hours in a week to be scheduled
from gurobi.Names import *


def shiftpopulator():
    results = []
    # weeknumber can be added if need be by adding an extra forloop and the code could be very similar to the hours
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    blocks = range(48)
    for i in days:
        for j in blocks:
            # concatenating the day string with the hour to generate the label for an hour that is to be scheduled
            results.append(i + str(j))
    return results

def NumberGenerator():
    tempnumber = "04"
    for j in range(8):
        tempnumber += str(random.randint(0, 9))
    return tempnumber


#turns shift strings into timeblocks
def DayHourtoNumConverter(DayHour):
    #totalblocks of time per day
    totalblocks=48
    #Starts from monday
    Timeblock=0
    if(DayHour[0:3]=="Tue"):
        Timeblock+=1*totalblocks
    if (DayHour[0:3] == "Wed"):
        Timeblock += 2*totalblocks
    if (DayHour[0:3] == "Thu"):
        Timeblock += 3*totalblocks
    if (DayHour[0:3] == "Fri"):
        Timeblock += 4*totalblocks
    if (DayHour[0:3] == "Sat"):
        Timeblock += 5*totalblocks
    if (DayHour[0:3] == "Sun"):
        Timeblock += 6*totalblocks
    Timeblock+=int(DayHour[3:5])
    return Timeblock
def NumtoDayHourConverter(Num):
    #totalblocks of time per day
    totalblocks=48
    DayHour=""
    #Starts from monday
    if(Num<totalblocks*1):
        DayHour += "Mon"
    elif(Num<totalblocks*2):
        DayHour += "Tue"
    elif (Num < totalblocks * 3):
        DayHour += "Wed"
    elif (Num < totalblocks * 4):
        DayHour += "Thu"
    elif (Num < totalblocks * 5):
        DayHour += "Fri"
    elif (Num < totalblocks * 6):
        DayHour += "Sat"
    else:
        DayHour += "Sun"
    DayHour += str(Num%totalblocks)

    return DayHour
#returns true Percent% of the time
def booleangenerator(Percent):
    if(Percent>=random.randint(1, 100)):
        return True
    else:
        return False



def AvailabilityGenerator():
    AvailDict = {}
    #arbitrary false declaration so the value assigned in the loop stays on
    generatedbool=False
    for j in shiftpopulator():
        # i is timeblock
        i=DayHourtoNumConverter(j)
        # 240 corressponds to 12am on a saturday so i<240 represents weekdays
        if(i<240):
            if(i%48==0):
                #at 12 am to 9am on weekdays generates a true 10% of the time for the set of volunteers generated
                generatedbool=booleangenerator(10)
            if (i % 48 == 18):
                #at 9am to 5pm on weekdays generates a true 20% of the time for the set of volunteers
                generatedbool = booleangenerator(20)
            if (i % 48 == 34):
                #  5pm onwards on weekdays generates a true 80% of the time for the set of volunteers
                generatedbool = booleangenerator(80)
        #weekdays
        else:
        # weekends
            if (i % 48 == 0):
                # at 12 am to 9am on weekends generates a true 10% of the time for the set of volunteers generated
                generatedbool = booleangenerator(10)
            if (i % 48 == 18):
                # at 9am onwards on weekends generates a true 80% of the time for the set of volunteers
                generatedbool = booleangenerator(80)

        #assigns the generated boolean
        #converts to the string format for now
        AvailDict[j]=generatedbool

    return AvailDict
QualificationList=["Heavy Rigid Vehicle License","Tanker Driving training",
                   "Urgent Duty Driving Training","Advanced Pumping Skills","Crew Leader Course",
                   "Advanced Firefighting Qualification"]






# each volunteer has an Name,Experience level, preferred Hours, Availability
# is availability different
class Volunteer:
    def __init__(self, id,name, Explvl, prefHours,phonenumber,Availability,Qualifications,YearsOfExperience):
        self.id=id
        self.name = name
        self.Explvl = Explvl
        self.prefHours = prefHours
        self.phonenumber=phonenumber
        self.Availability = Availability
        self.Qualifications=Qualifications
        self.YearsOfExperience=YearsOfExperience

#Randomly generating a group of different Volunteers
#THIS FUNCTION OCCASIONALLY ATTEMPTS TO ACCESS AN OUT OF BOUNDS INDEX, around line 110
def VolunteerGenerate(volunteerNo, folder_path):
    list_volunteers = []
    #generates twice as many advanced firefighters as basic
    for i in range(volunteerNo):
        QualDict={}
        #Creates a dictionary with all the qualifications as false
        for j in QualificationList:
            QualDict[j]=False
        #Generates a random name from the pool available
        Name=firstNames[random.randint(0,len(firstNames)-1)]+" "+lastNames[random.randint(0,len(lastNames)-1)]
        #50% are basic
        if(booleangenerator(50)):
            years=random.randint(0,2)

        #30% are just advanced
        elif(booleangenerator(60)):
            years = random.randint(3, 10)

            #corresponds to the advanced firefighting qualifications
            QualDict[QualificationList[5]]=True
        #14% are drivers
        elif(booleangenerator(70)):
            years = random.randint(7, 20)
            for j in range(len(QualificationList)):
                QualDict[QualificationList[j]]=True
        #6% are crewleaders
        else:
            years = random.randint(4, 15)
            for j in range(len(QualificationList)):
                #Corresponds to the Advanced firefighter qualification and the Crew Leader course
                if(j>=4):
                    QualDict[QualificationList[j]]=True
        VolunteerQualificationList=[]
        for k in QualificationList:
            if (QualDict[k] == True):
               VolunteerQualificationList.append(k)

        exp=QualificationtoRoleqaulification(years,QualDict)
        #preferred hours between 6 and 14
        prefnum=random.randint(6, 14)
        #Generates an Availability
        AvailDict = AvailabilityGenerator()


        #generates a random australian phone number
        tempnumber = NumberGenerator()
        #adds the volunteer to the list with all the generated data
        list_volunteers.append(Volunteer(i,Name, exp,prefnum,tempnumber,AvailDict,VolunteerQualificationList,years))
    VolunteerJson(list_volunteers,folder_path)
    return list_volunteers



def VolunteerTest(number):
    Volunteers=VolunteerGenerate(number,"Volunteers")
    for i in Volunteers:
            print("ID: " + str(i.id))
            print("Name: "+ i.name)
            print("preferred Hours: "+str(i.prefHours))
            print("Experience level: "+str(i.Explvl))
            print("Phone Number: "+i.phonenumber)
            print("Years of Experience: "+str(i.YearsOfExperience))
            print("Additional Qualifications: ")
            for k in i.Qualifications:
                    print(k)
            print("Availability: ")
            for j in shiftpopulator():
                print(j+": "+str(i.Availability[j]))
            print("\n")


def deleteContents(path):
    import os, shutil
    folder = path
    for filename in os.listdir(folder):
        file_path = os.path.join(folder, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        except Exception as e:
            print('Failed to delete %s. Reason: %s' % (file_path, e))
#generates number volunteers in the volunteers folder
def VolunteerJson(Volunteers, folder_path):
    #Converting the enums into strings for JSon
    for i in Volunteers:
        i.Explvl=i.Explvl.value
    j=0
    #this is to ensure that the volunteers from previous runs of the file are being deleted
    deleteContents(folder_path)

    for i in Volunteers:
        with open(folder_path + '/volunteer'+str(j)+'.json', 'w') as fp:
            json.dump(i.__dict__, fp)
        j += 1

# Load a single volunteer by file name
def LoadVolunteerFile(folder_path, file_name):
    try:
        file_path = os.path.join(folder_path, file_name)
        with open(file_path, 'r') as f:
            contents = json.load(f)
            # compile their details into a Volunteer object
            file_volunteer = Volunteer(
                contents['id'],
                contents['name'],
                contents['Explvl'],
                contents['prefHours'],
                contents['phonenumber'],
                contents['Availability'],
                contents['Qualifications'],
                contents['YearsOfExperience'],
            )
            return file_volunteer
    except:
        print("Could not open file: {}".format(str(folder_path) + str(file_name)))

# Load every volunteer. Return a list of all these Volunteer objects
def LoadVolunteers(folder_path):
    list_volunteers = []
    # Get all files in path
    for file_name in os.listdir(folder_path):
        list_volunteers.append(LoadVolunteerFile(folder_path, file_name))
    return list_volunteers

# Load a single volunteer by id
def LoadVolunteer(folder_path, id):
    file_name = 'volunteer'+str(id)+'.json'
    return LoadVolunteerFile(folder_path, file_name)
    

# Ensure the correct number of volunteers have been generated
# If regenerate is True, force generate new volunteers
def SetVolunteerNumber(folder_path, number, regenerate):
    if regenerate:
        VolunteerGenerate(number, folder_path)
        print("Generated new volunteers")
    else:
        number_volunteers = len(os.listdir(folder_path))
        if number_volunteers is not number:
            VolunteerGenerate(number, folder_path)
            print("Generated new volunteers")