import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'userFilter'
})
export class UserFilterPipePipe implements PipeTransform {

    transform(users: any[], subjectId: string): any[] {
    if (!users) return [];
    if (!subjectId) return users;
    
    
   
    return users.filter(user => {
      let selectedSubjects = [];
       for(let role in user.roles){
          if(user.roles[role]?.subjectIds){
            selectedSubjects =[...selectedSubjects,...user.roles[role]?.subjectIds];
          }
      }

    return selectedSubjects.includes(subjectId);
    }
      
    );
  }

}
